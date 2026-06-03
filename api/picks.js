// Global editorial "Quality Picks" — one shared list for all members.
// GET  /api/picks  -> { picks: [...] | null, isOwner }   (any signed-in patron)
// PUT  /api/picks  -> { ok }                              (owner only)
//
// Owner = email in PATREON_OWNER_EMAILS (same env used by the auth callback).
// Stored in Vercel KV under a single global key. If KV isn't configured, GET
// returns null (pages fall back to the seed list) and PUT returns 503.

import crypto from 'node:crypto';

const KEY = 'picks:v1';

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

// ── Sanitizers ──
const str = (s, n) => String(s == null ? '' : s).slice(0, n);
const clampNum = (v, lo, hi, d = 0) => { const n = Number(v); return Number.isFinite(n) ? Math.max(lo, Math.min(hi, Math.round(n))) : d; };
const SENT = ['Bullish', 'Neutral', 'Bearish'];
const CONV = ['High', 'Medium', 'Low'];
function cleanPicks(arr) {
  if (!Array.isArray(arr)) return null;
  return arr.slice(0, 20).map((p) => ({
    symbol: str(p && p.symbol, 12).toUpperCase().replace(/[^A-Z0-9.\-]/g, ''),
    score: clampNum(p && p.score, 0, 100, 50),
    sentiment: SENT.includes(p && p.sentiment) ? p.sentiment : 'Neutral',
    sentimentScore: clampNum(p && p.sentimentScore, 0, 100, 50),
    conviction: CONV.includes(p && p.conviction) ? p.conviction : 'Medium',
    narrative: clampNum(p && p.narrative, 0, 100, 50),
    tags: Array.isArray(p && p.tags) ? p.tags.slice(0, 5).map((t) => str(t, 40)).filter(Boolean) : [],
    thesis: str(p && p.thesis, 600),
  })).filter((p) => p.symbol);
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  const { SESSION_SECRET } = process.env;
  if (!SESSION_SECRET) { res.status(200).json({ picks: null, isOwner: false, reason: 'not_configured' }); return; }

  const payload = verifyJWT(parseCookie(req.headers.cookie, 'pt_session'), SESSION_SECRET);
  if (!payload) { res.status(401).json({ picks: null, isOwner: false }); return; }

  const ownerEmails = ['liksen855@gmail.com', ...(process.env.PATREON_OWNER_EMAILS || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)];
  const isOwner = !!(payload.email && ownerEmails.includes(String(payload.email).toLowerCase()));

  if (req.method === 'GET') {
    let picks = null;
    if (kvOK()) { try { const d = await kvGet(KEY); picks = (d && Array.isArray(d.picks)) ? d.picks : null; } catch (_) {} }
    res.status(200).json({ picks, isOwner });
    return;
  }

  if (req.method === 'PUT' || req.method === 'POST') {
    if (!isOwner) { res.status(403).json({ ok: false, error: 'not_owner' }); return; }
    if (!kvOK()) { res.status(503).json({ ok: false, error: 'store_unconfigured' }); return; }
    let body = req.body; if (typeof body === 'string') { try { body = JSON.parse(body); } catch (_) { body = {}; } }
    const picks = cleanPicks(body && body.picks);
    if (picks == null) { res.status(400).json({ ok: false, error: 'bad_picks' }); return; }
    try { await kvSet(KEY, { picks, updatedAt: Date.now(), by: payload.email || '' }); res.status(200).json({ ok: true, count: picks.length }); }
    catch (_) { res.status(502).json({ ok: false, error: 'kv_write_failed' }); }
    return;
  }

  res.status(405).json({ ok: false, error: 'method_not_allowed' });
}
