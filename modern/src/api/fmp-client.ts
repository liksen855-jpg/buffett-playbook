/**
 * Typed FMP API client with Zod validation.
 *
 * Every call is validated at runtime. If FMP changes a field name or type,
 * the Zod parse throws a descriptive error instead of letting bad data
 * propagate into valuation math.
 */

import { z } from 'zod'

const FMP_BASE = 'https://financialmodelingprep.com/stable'

function getFmpKey(): string {
  return localStorage.getItem('ii_fmp_key') || 'n2TIc6JypdMUhyFVtxrdqDBv0dIsK2Zg'
}

export class FMPError extends Error {
  constructor(
    message: string,
    public status?: number,
    public path?: string,
    public cause?: unknown
  ) {
    super(message)
    this.name = 'FMPError'
  }
}

/**
 * Core fetch function with Zod validation.
 *
 * @param path   FMP API path (e.g., "/quote?symbol=AAPL")
 * @param schema Zod schema to validate response against
 * @returns      Typed, validated data
 */
export async function fmpFetch<T extends z.ZodTypeAny>(
  path: string,
  schema: T
): Promise<z.infer<T>> {
  const sep = path.includes('?') ? '&' : '?'
  const url = `${FMP_BASE}${path}${sep}apikey=${getFmpKey()}`

  let response: Response
  try {
    response = await fetch(url)
  } catch (networkErr) {
    throw new FMPError(
      `Network error fetching ${path}`,
      undefined,
      path,
      networkErr
    )
  }

  if (!response.ok) {
    throw new FMPError(
      `FMP returned ${response.status} for ${path}`,
      response.status,
      path
    )
  }

  let raw: unknown
  try {
    raw = await response.json()
  } catch (parseErr) {
    throw new FMPError(
      `Invalid JSON from FMP for ${path}`,
      response.status,
      path,
      parseErr
    )
  }

  // FMP sometimes returns an error object instead of array
  if (
    raw &&
    typeof raw === 'object' &&
    !Array.isArray(raw) &&
    'Error Message' in raw
  ) {
    throw new FMPError(
      `FMP error: ${(raw as Record<string, string>)['Error Message']}`,
      response.status,
      path
    )
  }

  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    console.error('FMP schema mismatch:', parsed.error.format())
    throw new FMPError(
      `Schema validation failed for ${path}: ${parsed.error.message}`,
      response.status,
      path,
      parsed.error
    )
  }

  return parsed.data
}

/**
 * Fetch multiple endpoints in parallel with individual error isolation.
 *
 * If one endpoint fails, the others still resolve. Failed endpoints
 * return `null` and log to console.
 */
export async function fmpFetchAll<T extends Record<string, z.ZodTypeAny>>(
  requests: { [K in keyof T]: { path: string; schema: T[K] } }
): Promise<{ [K in keyof T]: z.infer<T[K]> | null }> {
  const entries = Object.entries(requests) as [
    string,
    { path: string; schema: z.ZodTypeAny }
  ][]

  const results = await Promise.allSettled(
    entries.map(([_, req]) => fmpFetch(req.path, req.schema))
  )

  const out: Record<string, unknown> = {}
  entries.forEach(([key], i) => {
    const result = results[i]
    if (result.status === 'fulfilled') {
      out[key] = result.value
    } else {
      console.warn(`FMP fetch failed [${key}]:`, result.reason)
      out[key] = null
    }
  })

  return out as { [K in keyof T]: z.infer<T[K]> | null }
}

/**
 * Chunk an array into smaller arrays for batch API calls.
 */
export function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size))
  }
  return out
}

/**
 * Fetch quotes for multiple symbols in batched calls (50 per batch).
 * Paid tier supports larger batches — adjust as needed.
 */
export async function fetchBatchQuotes(
  symbols: string[],
  batchSize = 50
): Promise<Map<string, { price: number; changePct: number; volume: number }>> {
  const bySymbol = new Map<
    string,
    { price: number; changePct: number; volume: number }
  >()

  const batches = chunk(symbols, batchSize)
  await Promise.all(
    batches.map(async (batch) => {
      try {
        const { BatchQuoteArraySchema } = await import('./types')
        const quotes = await fmpFetch(
          `/quote?symbol=${encodeURIComponent(batch.join(','))}`,
          BatchQuoteArraySchema
        )
        quotes.forEach((q) => {
          if (q.symbol && q.price != null) {
            bySymbol.set(q.symbol, {
              price: q.price,
              changePct: q.changePercentage ?? q.changesPercentage ?? 0,
              volume: q.volume ?? 0,
            })
          }
        })
      } catch (e) {
        console.warn('Batch quote failed for:', batch.join(','), e)
      }
    })
  )

  return bySymbol
}

/**
 * Check if FMP key is valid by making a lightweight call.
 */
export async function validateFmpKey(key?: string): Promise<boolean> {
  const testKey = key || getFmpKey()
  try {
    const r = await fetch(
      `${FMP_BASE}/quote?symbol=AAPL&apikey=${testKey}`
    )
    if (!r.ok) return false
    const data = await r.json()
    return Array.isArray(data) && data.length > 0 && data[0].price != null
  } catch {
    return false
  }
}