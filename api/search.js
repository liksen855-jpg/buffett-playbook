/"
 * Stock search endpoint — finds tickers by company name or symbol.
 *
 * Why this exists:
 *   Terminal and stock details need typeahead search.
 *   FMP provides a search API; this endpoint adds caching and sanitization.
 *
 * Usage:
 *   GET /api/search?q=Apple
 *   GET /api/search?q=AAPL&limit=10
 *
 * Headers:
 *   x-fmp-key: YOUR_FMP_KEY  (optional — overrides shared demo key)
 *
 * Response:
 *   { "query": "Apple", "count": 5, "results": [
 *     { "symbol": "AAPL", "name": "Apple Inc.", "exchange": "NASDAQ", "type": "stock" }
 *   ]}
 */

import { setCORS, setShortCache } from './lib/auth.js';
import { checkRateLimit, rateLimitHeaders } from './lib/rate-limit.js';
import { fmpSearch } from './lib/fmp.js';

export default async function handler(req, res) {
  setCORS(res, { methods: 'GET' });

  const rl = checkRateLimit(req, { maxReqs: 120 });
  rateLimitHeaders(res, rl);
  if (!rl.allowed) {
    res.status(429).json({ error: 'Rate limit exceeded', retryAfter: rl.retryAfter });
    return;
  }

  const query = String(req.query?.q || '').trim().slice(0, 50);
  const limit = Math.min(50, Math.max(1, parseInt(req.query?.limit, 10) || 10));

  if (!query || query.length < 1) {
    res.status(400).json({ error: 'Missing or too short query param' });
    return;
  }

  try {
    const raw = await fmpSearch(query, { req, cacheSeconds: 300 });
    const results = raw.slice(0, limit).map((item) => ({
      symbol: item.symbol,
      name: item.name,
      exchange: item.exchangeShortName || item.exchange || null,
      type: item.type || 'stock',
    }));

    setShortCache(res, 300);
    res.status(200).json({
      query,
      count: results.length,
      results,
    });
  } catch (e) {
    res.status(502).json({ error: 'Search unavailable', detail: e.message });
  }
}
