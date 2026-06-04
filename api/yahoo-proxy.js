/**
 * Yahoo Finance proxy — reliable CORS-free price fetcher.
 *
 * Why this exists:
 *   Free public CORS proxies (corsproxy.io, allorigins.win) are unreliable
 *   and often block or rate-limit requests. This serverless function runs
 *   on the same Vercel infrastructure, so it never hits CORS issues.
 *
 * Usage:
 *   GET /api/yahoo-proxy?symbol=SPY
 *   GET /api/yahoo-proxy?symbols=SPY,QQQ,AAPL
 *
 * Response:
 *   { "SPY": { price, change, changePct, name }, ... }
 */

const YF_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';

async function fetchYahoo(sym) {
  const url = `${YF_BASE}/${encodeURIComponent(sym)}?interval=1d&range=2d`;
  const r = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Accept': 'application/json',
    },
  });
  if (!r.ok) throw new Error(`YF ${r.status}`);
  const d = await r.json();
  const meta = d?.chart?.result?.[0]?.meta;
  if (!meta) throw new Error('No meta');

  const price = meta.regularMarketPrice || meta.previousClose;
  const prev  = meta.previousClose || meta.chartPreviousClose || price;
  const change = price && prev ? price - prev : 0;
  const pct    = prev ? change / prev * 100 : 0;

  return {
    symbol: sym,
    price:  Math.round(price * 10000) / 10000,
    change: Math.round(change * 10000) / 10000,
    changePct: Math.round(pct * 1000000) / 1000000,
    name: (meta.longName || meta.shortName || sym).slice(0, 34),
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60');

  const raw = req.query?.symbols || req.query?.symbol || '';
  const symbols = String(raw)
    .split(/[,\s]+/)
    .map(s => s.trim().toUpperCase())
    .filter(Boolean);

  if (!symbols.length) {
    res.status(400).json({ error: 'Missing symbols query param' });
    return;
  }

  const results = {};
  const errors = [];

  // Fetch in parallel with individual error isolation
  await Promise.all(
    symbols.map(async (sym) => {
      try {
        results[sym] = await fetchYahoo(sym);
      } catch (e) {
        errors.push({ symbol: sym, error: e.message });
      }
    })
  );

  res.status(200).json({
    ts: new Date().toISOString(),
    data: results,
    errors: errors.length ? errors : undefined,
  });
}
