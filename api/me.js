// Per-account store for the signed-in patron: watchlist + portfolio.
// Refactored to use shared auth + KV utilities.

import { getSession, setNoCache } from '../lib/auth.js';
import { kvConfigured, kvGet, kvSet } from '../lib/kv.js';
import { checkRateLimit, rateLimitHeaders } from '../lib/rate-limit.js';

// ── Sanitizers — never trust the client body ──
const cleanSym = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9.\-]/g, '').slice(0, 12);
function cleanWatchlist(wl) {
  if (!Array.isArray(wl)) return undefined;
  const seen = new Set();
  const out = [];
  for (const s of wl) {
    const sym = cleanSym(s);
    if (sym && !seen.has(sym)) { seen.add(sym); out.push(sym); }
    if (out.length >= 100) break;
  }
  return out;
}
function cleanPortfolio(pf) {
  if (!pf || typeof pf !== 'object') return undefined;
  const num = (v, max) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? Math.min(n, max) : 0;
  };
  const holdings = Array.isArray(pf.holdings) ? pf.holdings.slice(0, 100).map((h) => ({
    symbol: cleanSym(h && h.symbol),
    shares: num(h && h.shares, 1e9),
    avgCost: num(h && h.avgCost, 1e7),
  })).filter((h) => h.symbol) : [];
  return { cash: num(pf.cash, 1e12), holdings };
}

export default async function handler(req, res) {
  setNoCache(res);

  // Rate limiting: 60 writes/min, 120 reads/min
  const isWrite = req.method === 'PUT' || req.method === 'POST';
  const rl = checkRateLimit(req, { maxReqs: isWrite ? 60 : 120 });
  rateLimitHeaders(res, rl);
  if (!rl.allowed) {
    res.status(429).json({ error: 'Rate limit exceeded', retryAfter: rl.retryAfter });
    return;
  }

  const session = getSession(req);
  if (!session.ok) {
    res.status(200).json({ authenticated: false, reason: session.reason });
    return;
  }
  const key = 'user:' + session.payload.sub;

  if (req.method === 'GET') {
    if (!kvConfigured()) { res.status(200).json({ authenticated: true, data: null, store: 'unconfigured' }); return; }
    try {
      const data = (await kvGet(key)) || {};
      res.status(200).json({ authenticated: true, data: { watchlist: data.watchlist || null, portfolio: data.portfolio || null } });
    } catch (e) {
      res.status(200).json({ authenticated: true, data: null, error: 'kv_read_failed' });
    }
    return;
  }

  if (req.method === 'PUT' || req.method === 'POST') {
    if (!kvConfigured()) { res.status(503).json({ ok: false, error: 'store_unconfigured' }); return; }
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (_) { body = {}; } }
    body = body || {};
    try {
      const prev = (await kvGet(key)) || {};
      const next = { ...prev };
      const wl = cleanWatchlist(body.watchlist);
      const pf = cleanPortfolio(body.portfolio);
      if (wl !== undefined) next.watchlist = wl;
      if (pf !== undefined) next.portfolio = pf;
      next.updatedAt = Date.now();
      await kvSet(key, next);
      res.status(200).json({ ok: true });
    } catch (e) {
      res.status(502).json({ ok: false, error: 'kv_write_failed' });
    }
    return;
  }

  res.status(405).json({ ok: false, error: 'method_not_allowed' });
}
