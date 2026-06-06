/**
 * Historical price data endpoint — returns OHLCV time series for charting.
 *
 * Why this exists:
 *   Stock details and terminal sparklines need historical data.
 *   Yahoo Finance provides this free; FMP requires paid tier for historical.
 *   This endpoint proxies Yahoo with server-side caching.
 *
 * Usage:
 *   GET /api/historical?ticker=AAPL&range=1y&interval=1d
 *   GET /api/historical?ticker=SPY&range=5y&interval=1wk
 *
 * Range options: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max
 * Interval options: 1m, 2m, 5m, 15m, 30m, 60m, 1d, 1wk, 1mo
 *
 * Response:
 *   { "ticker": "AAPL", "range": "1y", "interval": "1d", "data": [
 *     { "date": "2025-06-04", "open": 195.2, "high": 197.5, "low": 194.8, "close": 196.8, "volume": 45200000 }
 *   ]}
 */

import { setCORS, setShortCache } from './lib/auth.js';
import { checkRateLimit, rateLimitHeaders } from './lib/rate-limit.js';

const VALID_RANGES = new Set(['1d','5d','1mo','3mo','6mo','1y','2y','5y','10y','ytd','max']);
const VALID_INTERVALS = new Set(['1m','2m','5m','15m','30m','60m','1d','1wk','1mo']);

function parseYahooCandle(result) {
  const { timestamp, indicators } = result;
  const quote = indicators?.quote?.[0];
  const adjclose = indicators?.adjclose?.[0]?.adjclose;
  if (!timestamp || !quote) return [];

  const out = [];
  for (let i = 0; i < timestamp.length; i++) {
    const o = quote.open?.[i];
    const h = quote.high?.[i];
    const l = quote.low?.[i];
    const c = quote.close?.[i];
    const v = quote.volume?.[i];
    if (o == null || h == null || l == null || c == null) continue;
    out.push({
      date: new Date(timestamp[i] * 1000).toISOString().slice(0, 10),
      open:  Math.round(o * 100) / 100,
      high:  Math.round(h * 100) / 100,
      low:   Math.round(l * 100) / 100,
      close: Math.round(c * 100) / 100,
      volume: v ?? 0,
      adjClose: adjclose?.[i] != null ? Math.round(adjclose[i] * 100) / 100 : undefined,
    });
  }
  return out;
}

export default async function handler(req, res) {
  setCORS(res, { methods: 'GET' });

  const rl = checkRateLimit(req, { maxReqs: 60 });
  rateLimitHeaders(res, rl);
  if (!rl.allowed) {
    res.status(429).json({ error: 'Rate limit exceeded', retryAfter: rl.retryAfter });
    return;
  }

  const ticker = String(req.query?.ticker || '').toUpperCase().replace(/[^A-Z0-9.\-]/g, '').slice(0, 12);
  const range = VALID_RANGES.has(req.query?.range) ? req.query.range : '1y';
  const interval = VALID_INTERVALS.has(req.query?.interval) ? req.query.interval : '1d';

  if (!ticker) {
    res.status(400).json({ error: 'Missing ticker param' });
    return;
  }

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=${interval}&range=${range}&includeAdjustedClose=true`;

  try {
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    });
    if (!r.ok) throw new Error(`Yahoo ${r.status}`);
    const d = await r.json();
    const result = d?.chart?.result?.[0];
    const error = d?.chart?.error;

    if (error) {
      res.status(404).json({ error: error.description || 'Ticker not found' });
      return;
    }
    if (!result) {
      res.status(502).json({ error: 'No data from Yahoo Finance' });
      return;
    }

    const data = parseYahooCandle(result);
    const meta = result.meta || {};

    // Cache longer for historical data (rarely changes)
    const cacheSeconds = range === '1d' || range === '5d' ? 60 : range === 'max' ? 86400 : 3600;
    setShortCache(res, cacheSeconds);

    res.status(200).json({
      ticker,
      range,
      interval,
      currency: meta.currency || 'USD',
      exchange: meta.exchangeName || null,
      data,
    });
  } catch (e) {
    res.status(502).json({ error: 'Failed to fetch historical data', detail: e.message });
  }
}
