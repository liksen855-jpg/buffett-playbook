/**
 * Shared FMP (Financial Modeling Prep) client with caching.
 * Supports per-user API key override via x-fmp-key header.
 */

import { kvConfigured, kvGetWithTTL, kvSetEx } from './kv.js';

const FMP_BASE = 'https://financialmodelingprep.com/stable';

function getKey(req) {
  // Per-user override via header (power users with their own FMP key)
  if (req && req.headers) {
    const override = req.headers['x-fmp-key'];
    if (override && /^[a-zA-Z0-9]{20,64}$/.test(override)) {
      return override;
    }
  }
  // Shared demo key (rate-limited, for general use)
  return 'n2TIc6JypdMUhyFVtxrdqDBv0dIsK2Zg';
}

function cacheKey(path) {
  return 'fmp:' + path.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 200);
}

/**
 * Fetch from FMP with optional KV caching.
 * @param {string} path - FMP API path (e.g. "/quote?symbol=AAPL")
 * @param {object} opts - { req?, cacheSeconds?: number, skipCache?: boolean }
 */
export async function fmpFetch(path, opts = {}) {
  const key = getKey(opts.req);
  const url = `${FMP_BASE}${path}${path.includes('?') ? '&' : '?'}apikey=${key}`;
  const cacheSecs = opts.cacheSeconds ?? 60;
  const cacheK = cacheKey(path);

  // Try cache first
  if (!opts.skipCache && kvConfigured() && cacheSecs > 0) {
    try {
      const cached = await kvGetWithTTL(cacheK);
      if (cached.hit) return cached.data;
    } catch (_) { /* cache miss or error — proceed to fetch */ }
  }

  const r = await fetch(url);
  if (!r.ok) throw new Error(`FMP ${r.status}`);
  const data = await r.json();

  // Write to cache
  if (!opts.skipCache && kvConfigured() && cacheSecs > 0) {
    try { await kvSetEx(cacheK, data, cacheSecs); } catch (_) {}
  }

  return data;
}

/**
 * Batch quote fetch — splits large symbol lists into chunks.
 * FMP allows up to ~50 symbols per /quote call.
 */
export async function fmpBatchQuotes(symbols, opts = {}) {
  const chunkSize = opts.chunkSize || 50;
  const chunks = [];
  for (let i = 0; i < symbols.length; i += chunkSize) {
    chunks.push(symbols.slice(i, i + chunkSize));
  }

  const results = {};
  await Promise.all(
    chunks.map(async (chunk) => {
      try {
        const data = await fmpFetch('/quote?symbol=' + encodeURIComponent(chunk.join(',')), {
          req: opts.req,
          cacheSeconds: opts.cacheSeconds ?? 30,
        });
        (Array.isArray(data) ? data : []).forEach((q) => {
          if (q && q.symbol) results[q.symbol] = q;
        });
      } catch (_) { /* individual chunk failure is non-fatal */ }
    })
  );
  return results;
}

/**
 * Search stocks by name or symbol.
 */
export async function fmpSearch(query, opts = {}) {
  const data = await fmpFetch('/search?query=' + encodeURIComponent(query), {
    req: opts.req,
    cacheSeconds: opts.cacheSeconds ?? 300,
  });
  return Array.isArray(data) ? data : [];
}
