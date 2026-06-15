// Global editorial "Quality Picks" — refactored to use shared auth + KV utilities.

import { getSession, setNoCache } from './lib/auth.js';
import { kvConfigured, kvGet, kvSet } from './lib/kv.js';
import { checkRateLimit, rateLimitHeaders } from './lib/rate-limit.js';
import { notifyPicks } from './lib/discord.js';

const KEY = 'picks:v1';

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
    res.status(401).json({ picks: null, isOwner: false, reason: session.reason });
    return;
  }

  const owner = isOwner(session.payload.email);

  if (req.method === 'GET') {
    let picks = null;
    if (kvConfigured()) { try { const d = await kvGet(KEY); picks = (d && Array.isArray(d.picks)) ? d.picks : null; } catch (_) {} }
    res.status(200).json({ picks, isOwner: owner });
    return;
  }

  if (req.method === 'PUT' || req.method === 'POST') {
    if (!owner) { res.status(403).json({ ok: false, error: 'not_owner' }); return; }
    if (!kvConfigured()) { res.status(503).json({ ok: false, error: 'store_unconfigured' }); return; }
    let body = req.body; if (typeof body === 'string') { try { body = JSON.parse(body); } catch (_) { body = {}; } }
    const picks = cleanPicks(body && body.picks);
    if (picks == null) { res.status(400).json({ ok: false, error: 'bad_picks' }); return; }
    try { await kvSet(KEY, { picks, updatedAt: Date.now(), by: session.payload.email || '' }); notifyPicks(picks); res.status(200).json({ ok: true, count: picks.length }); }
    catch (_) { res.status(502).json({ ok: false, error: 'kv_write_failed' }); }
    return;
  }

  res.status(405).json({ ok: false, error: 'method_not_allowed' });
}
