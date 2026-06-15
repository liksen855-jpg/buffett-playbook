/**
 * Batch quote endpoint — fetches live prices for multiple symbols in one call.
 * 
 * Why this exists:
 *   The terminal currently makes 50 individual FMP calls per page load.
 *   This endpoint batches them server-side with caching, reducing:
 *   - Client-side request overhead
 *   - FMP API rate limit consumption
 *   - Page load time
 *
 * Usage:
 *   GET /api/batch-quotes?symbols=AAPL,MSFT,GOOGL
 *   GET /api/batch-quotes?symbols=AAPL,MSFT,GOOGL&source=fmp
 *   GET /api/batch-quotes?symbols=SPY,QQQ&source=yahoo  (fallback, no key needed)
 *
 * Headers:
 *   x-fmp-key: YOUR_FMP_KEY  (optional — overrides shared demo key)
 *
 * Response:
 *   { "ts": "2026-06-04T...", "count": 3, "data": { "AAPL": {...}, ... } }
 */

import { setCORS, setShortCache } from '../lib/auth.js';
import { checkRateLimit, rateLimitHeaders } from '../lib/rate-limit.js';
import { fmpBatchQuotes } from '../lib/fmp.js';

const YF_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';

async function fetchYahooBatch(symbols) {
  const results = {};
  await Promise.all(
    symbols.map(async (sym) => {
      try {
        const url = `${YF_BASE}/${encodeURIComponent(sym)}?interval=1d&range=2d`;
        const r = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Accept': 'application/json',
          },
        });
        if (!r.ok) return;
        const d = await r.json();
        const meta = d?.chart?.result?.[0]?.meta;
        if (!meta) return;
        const price = meta.regularMarketPrice || meta.previousClose;
        const prev  = meta.previousClose || meta.chartPreviousClose || price;
        const change = price && prev ? price - prev : 0;
        const pct    = prev ? change / prev * 100 : 0;
        results[sym] = {
          symbol: sym,
          price:  Math.round(price * 10000) / 10000,
          change: Math.round(change * 10000) / 10000,
          changePct: Math.round(pct * 1000000) / 1000000,
          name: (meta.longName || meta.shortName || sym).slice(0, 34),
          source: 'yahoo',
        };
      } catch (_) { /* skip failed symbol */ }
    })
  );
  return results;
}

export default async function handler(req, res) {
  setCORS(res, { methods: 'GET' });

  // Rate limiting: 120 requests/minute (2x default because batch is efficient)
  const rl = checkRateLimit(req, { maxReqs: 120 });
  rateLimitHeaders(res, rl);
  if (!rl.allowed) {
    res.status(429).json({ error: 'Rate limit exceeded', retryAfter: rl.retryAfter });
    return;
  }

  const raw = req.query?.symbols || '';
  const symbols = String(raw)
    .split(/[,\s]+/)
    .map(s => s.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 100); // max 100 symbols per call

  if (!symbols.length) {
    res.status(400).json({ error: 'Missing symbols query param (max 100)' });
    return;
  }

  const source = req.query?.source || 'fmp'; // 'fmp' | 'yahoo'

  let data;
  try {
    if (source === 'yahoo') {
      data = await fetchYahooBatch(symbols);
    } else {
      // FMP batch with caching — pass req so per-user key override works
      const batch = await fmpBatchQuotes(symbols, { req, cacheSeconds: 30 });
      data = {};
      for (const sym of symbols) {
        const q = batch[sym];
        if (!q) continue;
        data[sym] = {
          symbol: sym,
          price: q.price ?? 0,
          change: q.change ?? 0,
          changePct: q.changesPercentage ?? q.changePercentage ?? 0,
          name: (q.name || sym).slice(0, 34),
          volume: q.volume ?? 0,
          marketCap: q.marketCap ?? 0,
          pe: q.pe ?? null,
          eps: q.eps ?? null,
          source: 'fmp',
        };
      }
    }
  } catch (e) {
    res.status(502).json({ error: 'Data source unavailable', detail: e.message });
    return;
  }

  setShortCache(res, 30);
  res.status(200).json({
    ts: new Date().toISOString(),
    count: Object.keys(data).length,
    requested: symbols.length,
    source,
    data,
  });
}
