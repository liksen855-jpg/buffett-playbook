// Global "Positions" book — one shared list of the desk's positions + write-ups.
// GET  /api/positions -> { positions: [...] | null, isOwner }  (any signed-in patron)
// PUT  /api/positions -> { ok }                                (owner only)
// Refactored to use shared auth + KV utilities.

import { getSession, setNoCache } from './lib/auth.js';
import { kvConfigured, kvGet, kvSet } from './lib/kv.js';
import { checkRateLimit, rateLimitHeaders } from './lib/rate-limit.js';

const KEY = 'positions:v1';

// ── Sanitizers ──
const str = (s, n) => String(s == null ? '' : s).slice(0, n);
const numF = (v) => { const n = Number(v); return Number.isFinite(n) && n >= 0 ? n : 0; };
const cleanUrl = (u) => { const s = str(u, 300).trim(); return (/^\/[^/]/.test(s) || /^https:\/\//i.test(s)) ? s : ''; };
const DIR = ['Long', 'Short'];
const STATUS = ['Open', 'Watching', 'Closed'];
function cleanPositions(arr) {
  if (!Array.isArray(arr)) return null;
  return arr.slice(0, 40).map((p) => ({
    symbol: str(p && p.symbol, 12).toUpperCase().replace(/[^A-Z0-9.\-]/g, ''),
    direction: DIR.includes(p && p.direction) ? p.direction : 'Long',
    entry: numF(p && p.entry),
    target: (p && p.target != null && p.target !== '') ? numF(p.target) : null,
    date: str(p && p.date, 24),
    status: STATUS.includes(p && p.status) ? p.status : 'Open',
    sizing: str(p && p.sizing, 60),
    report: str(p && p.report, 4000),
    reportUrl: cleanUrl(p && p.reportUrl),
  })).filter((p) => p.symbol);
}

// Owner check: ONLY env var, no hardcoded fallback
function isOwner(email) {
  if (!email) return false;
  const e = String(email).toLowerCase().trim();
  const envList = (process.env.PATREON_OWNER_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  return envList.includes(e);
}

export default async function handler(req, res) {
  setNoCache(res);

  const isWrite = req.method === 'PUT' || req.method === 'POST';
  const rl = checkRateLimit(req, { maxReqs: isWrite ? 30 : 120 });
  rateLimitHeaders(res, rl);
  if (!rl.allowed) {
    res.status(429).json({ error: 'Rate limit exceeded', retryAfter: rl.retryAfter });
    return;
  }

  const session = getSession(req);
  if (!session.ok) {
    res.status(401).json({ positions: null, isOwner: false, reason: session.reason });
    return;
  }

  const owner = isOwner(session.payload.email);

  if (req.method === 'GET') {
    let positions = null;
    if (kvConfigured()) { try { const d = await kvGet(KEY); positions = (d && Array.isArray(d.positions)) ? d.positions : null; } catch (_) {} }
    res.status(200).json({ positions, isOwner: owner });
    return;
  }

  if (req.method === 'PUT' || req.method === 'POST') {
    if (!owner) { res.status(403).json({ ok: false, error: 'not_owner' }); return; }
    if (!kvConfigured()) { res.status(503).json({ ok: false, error: 'store_unconfigured' }); return; }
    let body = req.body; if (typeof body === 'string') { try { body = JSON.parse(body); } catch (_) { body = {}; } }
    const positions = cleanPositions(body && body.positions);
    if (positions == null) { res.status(400).json({ ok: false, error: 'bad_positions' }); return; }
    try { await kvSet(KEY, { positions, updatedAt: Date.now(), by: session.payload.email || '' }); res.status(200).json({ ok: true, count: positions.length }); }
    catch (_) { res.status(502).json({ ok: false, error: 'kv_write_failed' }); }
    return;
  }

  res.status(405).json({ ok: false, error: 'method_not_allowed' });
}
