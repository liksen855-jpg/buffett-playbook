// Global "Positions" book — one shared list of the desk's positions + write-ups.
// GET  /api/positions -> { positions: [...] | null, isOwner }  (any signed-in patron)
// PUT  /api/positions -> { ok }                                (owner only)
// Same model as /api/picks: owner = email in PATREON_OWNER_EMAILS, stored in KV.

import crypto from 'node:crypto';
import { notifyPositions } from './lib/discord.js';

const KEY = 'positions:v1';
const OWNER_FALLBACK = ['liksen855@gmail.com'];

function parseCookie(header, name) {
  if (!header) return null;
  for (const c of header.split(';')) { const [k, ...v] = c.trim().split('='); if (k === name) return v.join('='); }
  return null;
}
function verifyJWT(token, secret) {
  if (!token) return null;
  const p = token.split('.'); if (p.length !== 3) return null;
  const [h, b, sig] = p;
  const exp = crypto.createHmac('sha256', secret).update(`${h}.${b}`).digest('base64url');
  if (sig.length !== exp.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(exp))) return null;
  try { const pl = JSON.parse(Buffer.from(b, 'base64url').toString()); if (pl.exp && pl.exp * 1000 < Date.now()) return null; return pl; }
  catch (_) { return null; }
}
const KV_URL = () => process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = () => process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const kvOK = () => !!(KV_URL() && KV_TOKEN());
async function kvCmd(args) {
  const r = await fetch(KV_URL(), { method: 'POST', headers: { Authorization: `Bearer ${KV_TOKEN()}`, 'Content-Type': 'application/json' }, body: JSON.stringify(args) });
  if (!r.ok) throw new Error('KV ' + r.status);
  return (await r.json()).result;
}
const kvGet = async (k) => { const raw = await kvCmd(['GET', k]); if (raw == null) return null; try { return JSON.parse(raw); } catch (_) { return null; } };
const kvSet = (k, v) => kvCmd(['SET', k, JSON.stringify(v)]);

const str = (s, n) => String(s == null ? '' : s).slice(0, n);
const numF = (v) => { const n = Number(v); return Number.isFinite(n) && n >= 0 ? n : 0; };
// Only allow a same-origin path or an explicit https URL — blocks javascript:/data: iframe XSS.
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

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  const { SESSION_SECRET } = process.env;
  if (!SESSION_SECRET) { res.status(200).json({ positions: null, isOwner: false, reason: 'not_configured' }); return; }

  const payload = verifyJWT(parseCookie(req.headers.cookie, 'pt_session'), SESSION_SECRET);
  if (!payload) { res.status(401).json({ positions: null, isOwner: false }); return; }

  const ownerEmails = [...OWNER_FALLBACK, ...(process.env.PATREON_OWNER_EMAILS || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)];
  const isOwner = !!(payload.email && ownerEmails.includes(String(payload.email).toLowerCase()));

  if (req.method === 'GET') {
    let positions = null;
    if (kvOK()) { try { const d = await kvGet(KEY); positions = (d && Array.isArray(d.positions)) ? d.positions : null; } catch (_) {} }
    res.status(200).json({ positions, isOwner });
    return;
  }

  if (req.method === 'PUT' || req.method === 'POST') {
    if (!isOwner) { res.status(403).json({ ok: false, error: 'not_owner' }); return; }
    if (!kvOK()) { res.status(503).json({ ok: false, error: 'store_unconfigured' }); return; }
    let body = req.body; if (typeof body === 'string') { try { body = JSON.parse(body); } catch (_) { body = {}; } }
    const positions = cleanPositions(body && body.positions);
    if (positions == null) { res.status(400).json({ ok: false, error: 'bad_positions' }); return; }
    try { await kvSet(KEY, { positions, updatedAt: Date.now(), by: payload.email || '' }); notifyPositions(positions); res.status(200).json({ ok: true, count: positions.length }); }
    catch (_) { res.status(502).json({ ok: false, error: 'kv_write_failed' }); }
    return;
  }

  res.status(405).json({ ok: false, error: 'method_not_allowed' });
}
