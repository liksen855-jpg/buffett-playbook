// Per-account store for the signed-in patron: watchlist + portfolio.
// Keyed on the verified `sub` from the pt_session JWT (set by auth/callback).
// Backed by Vercel KV (Upstash) via its REST API — no npm dependency needed.
//
//   GET  /api/me            -> { authenticated, data: { watchlist, portfolio } | null }
//   PUT  /api/me   {body}   -> { ok } ; body = { watchlist?, portfolio? } (merged)
//
// Requires env: SESSION_SECRET (already set for auth) and the KV pair
// KV_REST_API_URL + KV_REST_API_TOKEN (added by the Vercel KV integration).
// If KV isn't configured yet, GET returns null data and PUT returns 503 — the
// pages fall back to localStorage/seed so nothing breaks before provisioning.

import crypto from 'node:crypto';

function parseCookie(header, name) {
  if (!header) return null;
  for (const c of header.split(';')) {
    const [k, ...v] = c.trim().split('=');
    if (k === name) return v.join('=');
  }
  return null;
}

function verifyJWT(token, secret) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [h, b, sig] = parts;
  const expected = crypto.createHmac('sha256', secret).update(`${h}.${b}`).digest('base64url');
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const payload = JSON.parse(Buffer.from(b, 'base64url').toString());
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch (_) { return null; }
}

// ── KV (Upstash REST) — single command via POST to the base URL ──
// Accept either the Vercel KV (KV_REST_API_*) or native Upstash
// (UPSTASH_REDIS_REST_*) env naming, depending on which integration is added.
const KV_URL = () => process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = () => process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
function kvConfigured() {
  return !!(KV_URL() && KV_TOKEN());
}
async function kvCmd(args) {
  const r = await fetch(KV_URL(), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${KV_TOKEN()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args),
  });
  if (!r.ok) throw new Error('KV ' + r.status);
  const j = await r.json();
  return j.result;
}
const kvGet = async (key) => {
  const raw = await kvCmd(['GET', key]);
  if (raw == null) return null;
  try { return JSON.parse(raw); } catch (_) { return null; }
};
const kvSet = (key, val) => kvCmd(['SET', key, JSON.stringify(val)]);

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
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  const { SESSION_SECRET } = process.env;
  if (!SESSION_SECRET) { res.status(200).json({ authenticated: false, reason: 'not_configured' }); return; }

  const payload = verifyJWT(parseCookie(req.headers.cookie, 'pt_session'), SESSION_SECRET);
  if (!payload || !payload.sub) { res.status(401).json({ authenticated: false }); return; }
  const key = 'user:' + payload.sub;

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

// redeploy: pick up Vercel KV env (2026-06-02T06:45Z)
