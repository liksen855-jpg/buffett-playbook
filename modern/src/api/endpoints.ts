/**
 * Typed endpoint wrappers for FMP API.
 *
 * Each function is a thin, typed wrapper around fmpFetch with the correct
 * schema and path construction. No raw string concatenation in components.
 */

import { fmpFetch } from './fmp-client'
import {
  CompanyProfileArraySchema,
  QuoteArraySchema,
  IncomeStatementArraySchema,
  BalanceSheetArraySchema,
  CashFlowArraySchema,
  KeyMetricsArraySchema,
  DCFArraySchema,
  HistoricalPriceLightArraySchema,
  EarningsArraySchema,
  EarningsCalendarArraySchema,
  NewsArraySchema,
  ScreenerArraySchema,
  MoverArraySchema,
  AnalystEstimateArraySchema,
  InsiderTradeArraySchema,
  InstitutionalHolderArraySchema,
} from './types'
import type {
  CompanyProfile,
  Quote,
  IncomeStatement,
  BalanceSheet,
  CashFlowStatement,
  KeyMetrics,
  DCF,
  HistoricalPriceLight,
  Earnings,
  EarningsCalendar,
  NewsItem,
  ScreenerResult,
  Mover,
  AnalystEstimate,
  InsiderTrade,
  InstitutionalHolder,
} from './types'

// ── Company Profile ──────────────────────────────────────────────────────────

export async function fetchProfile(symbol: string): Promise<CompanyProfile | null> {
  const data = await fmpFetch(
    `/profile?symbol=${encodeURIComponent(symbol)}`,
    CompanyProfileArraySchema
  )
  return data[0] ?? null
}

// ── Quote ────────────────────────────────────────────────────────────────────

export async function fetchQuote(symbol: string): Promise<Quote | null> {
  const data = await fmpFetch(
    `/quote?symbol=${encodeURIComponent(symbol)}`,
    QuoteArraySchema
  )
  return data[0] ?? null
}

// ── Financial Statements ─────────────────────────────────────────────────────

export async function fetchIncomeStatement(
  symbol: string,
  opts: { period?: 'annual' | 'quarter'; limit?: number } = {}
): Promise<IncomeStatement[]> {
  const period = opts.period === 'quarter' ? '&period=quarter' : ''
  const limit = opts.limit ? `&limit=${opts.limit}` : '&limit=10'
  return fmpFetch(
    `/income-statement?symbol=${encodeURIComponent(symbol)}${period}${limit}`,
    IncomeStatementArraySchema
  )
}

export async function fetchBalanceSheet(
  symbol: string,
  opts: { period?: 'annual' | 'quarter'; limit?: number } = {}
): Promise<BalanceSheet[]> {
  const period = opts.period === 'quarter' ? '&period=quarter' : ''
  const limit = opts.limit ? `&limit=${opts.limit}` : '&limit=10'
  return fmpFetch(
    `/balance-sheet-statement?symbol=${encodeURIComponent(symbol)}${period}${limit}`,
    BalanceSheetArraySchema
  )
}

export async function fetchCashFlow(
  symbol: string,
  opts: { period?: 'annual' | 'quarter'; limit?: number } = {}
): Promise<CashFlowStatement[]> {
  const period = opts.period === 'quarter' ? '&period=quarter' : ''
  const limit = opts.limit ? `&limit=${opts.limit}` : '&limit=10'
  return fmpFetch(
    `/cash-flow-statement?symbol=${encodeURIComponent(symbol)}${period}${limit}`,
    CashFlowArraySchema
  )
}

// ── Key Metrics ──────────────────────────────────────────────────────────────

export async function fetchKeyMetrics(
  symbol: string,
  opts: { period?: 'annual' | 'quarter'; limit?: number } = {}
): Promise<KeyMetrics[]> {
  const period = opts.period === 'quarter' ? '&period=quarter' : ''
  const limit = opts.limit ? `&limit=${opts.limit}` : '&limit=10'
  return fmpFetch(
    `/key-metrics?symbol=${encodeURIComponent(symbol)}${period}${limit}`,
    KeyMetricsArraySchema
  )
}

// ── DCF ──────────────────────────────────────────────────────────────────────

export async function fetchDCF(symbol: string): Promise<DCF | null> {
  const data = await fmpFetch(
    `/discounted-cash-flow?symbol=${encodeURIComponent(symbol)}`,
    DCFArraySchema
  )
  return data[0] ?? null
}

// ── Historical Prices ────────────────────────────────────────────────────────

export async function fetchHistoricalPrices(
  symbol: string,
  opts: { limit?: number; from?: string; to?: string } = {}
): Promise<HistoricalPriceLight[]> {
  // Try light endpoint first, fall back to full if needed
  const limit = opts.limit ? `&limit=${opts.limit}` : '&limit=1095'
  return fmpFetch(
    `/historical-price-eod/light?symbol=${encodeURIComponent(symbol)}${limit}`,
    HistoricalPriceLightArraySchema
  )
}

// ── Earnings ─────────────────────────────────────────────────────────────────

export async function fetchEarningsHistory(symbol: string): Promise<Earnings[]> {
  return fmpFetch(
    `/earnings?symbol=${encodeURIComponent(symbol)}`,
    EarningsArraySchema
  )
}

export async function fetchEarningsCalendar(
  opts: { from: string; to: string } = {
    from: new Date().toISOString().split('T')[0],
    to: new Date(Date.now() + 40 * 864e5).toISOString().split('T')[0],
  }
): Promise<EarningsCalendar[]> {
  return fmpFetch(
    `/earnings-calendar?from=${opts.from}&to=${opts.to}`,
    EarningsCalendarArraySchema
  )
}

// ── News ─────────────────────────────────────────────────────────────────────

export async function fetchStockNews(opts: { limit?: number } = {}): Promise<NewsItem[]> {
  const limit = opts.limit ?? 18
  return fmpFetch(`/news/stock-latest?limit=${limit}`, NewsArraySchema)
}

export async function fetchGeneralNews(opts: { limit?: number } = {}): Promise<NewsItem[]> {
  const limit = opts.limit ?? 18
  return fmpFetch(`/news/general-latest?limit=${limit}`, NewsArraySchema)
}

export async function fetchCryptoNews(opts: { limit?: number } = {}): Promise<NewsItem[]> {
  const limit = opts.limit ?? 18
  return fmpFetch(`/news/crypto-latest?limit=${limit}`, NewsArraySchema)
}

// ── Screener ─────────────────────────────────────────────────────────────────

export type ScreenerFilter = {
  sector?: string
  industry?: string
  marketCapMoreThan?: number
  marketCapLowerThan?: number
  priceMoreThan?: number
  priceLowerThan?: number
  volumeMoreThan?: number
  betaMoreThan?: number
  betaLowerThan?: number
  dividendMoreThan?: number
  exchange?: string
  limit?: number
  isActivelyTrading?: boolean
}

export async function fetchScreener(filters: ScreenerFilter = {}): Promise<ScreenerResult[]> {
  const params = new URLSearchParams()
  if (filters.sector) params.set('sector', filters.sector)
  if (filters.industry) params.set('industry', filters.industry)
  if (filters.marketCapMoreThan) params.set('marketCapMoreThan', String(filters.marketCapMoreThan))
  if (filters.marketCapLowerThan) params.set('marketCapLowerThan', String(filters.marketCapLowerThan))
  if (filters.priceMoreThan) params.set('priceMoreThan', String(filters.priceMoreThan))
  if (filters.priceLowerThan) params.set('priceLowerThan', String(filters.priceLowerThan))
  if (filters.volumeMoreThan) params.set('volumeMoreThan', String(filters.volumeMoreThan))
  if (filters.betaMoreThan) params.set('betaMoreThan', String(filters.betaMoreThan))
  if (filters.betaLowerThan) params.set('betaLowerThan', String(filters.betaLowerThan))
  if (filters.dividendMoreThan) params.set('dividendMoreThan', String(filters.dividendMoreThan))
  if (filters.exchange) params.set('exchange', filters.exchange)
  if (filters.isActivelyTrading != null) params.set('isActivelyTrading', String(filters.isActivelyTrading))
  params.set('limit', String(filters.limit ?? 50))

  return fmpFetch(`/company-screener?${params.toString()}`, ScreenerArraySchema)
}

// ── Movers ───────────────────────────────────────────────────────────────────

export async function fetchBiggestGainers(limit = 5): Promise<Mover[]> {
  return fmpFetch(`/biggest-gainers?limit=${limit}`, MoverArraySchema)
}

export async function fetchBiggestLosers(limit = 5): Promise<Mover[]> {
  return fmpFetch(`/biggest-losers?limit=${limit}`, MoverArraySchema)
}

export async function fetchMostActives(limit = 5): Promise<Mover[]> {
  return fmpFetch(`/most-actives?limit=${limit}`, MoverArraySchema)
}

// ── Analyst Estimates (paid tier) ────────────────────────────────────────────

export async function fetchAnalystEstimates(symbol: string): Promise<AnalystEstimate[]> {
  return fmpFetch(
    `/analyst-estimates?symbol=${encodeURIComponent(symbol)}`,
    AnalystEstimateArraySchema
  )
}

// ── Insider Trading (paid tier) ──────────────────────────────────────────────

export async function fetchInsiderTrading(symbol: string): Promise<InsiderTrade[]> {
  return fmpFetch(
    `/insider-trading?symbol=${encodeURIComponent(symbol)}&limit=20`,
    InsiderTradeArraySchema
  )
}

// ── Institutional Ownership (paid tier) ──────────────────────────────────────

export async function fetchInstitutionalOwnership(
  symbol: string
): Promise<InstitutionalHolder[]> {
  return fmpFetch(
    `/institutional-ownership?symbol=${encodeURIComponent(symbol)}`,
    InstitutionalHolderArraySchema
  )
}

// ── Batch Quote (paid tier) ──────────────────────────────────────────────────

export async function fetchBatchQuote(symbols: string[]): Promise<Quote[]> {
  if (symbols.length === 0) return []
  return fmpFetch(
    `/quote?symbol=${encodeURIComponent(symbols.join(','))}`,
    QuoteArraySchema
  )
}