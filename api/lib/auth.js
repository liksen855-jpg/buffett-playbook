/**
 * Shared auth utilities for InsightInvest API endpoints.
 * Eliminates duplication across me.js, picks.js, and other authenticated endpoints.
 */

import crypto from 'node:crypto';

// ── Cookie parsing ───────────────────────────────────────────────────────────

export function parseCookie(header, name) {
  if (!header) return null;
  for (const c of header.split(';')) {
    const [k, ...v] = c.trim().split('=');
    if (k === name) return v.join('=');
  }
  return null;
}

// ── JWT signing / verification ───────────────────────────────────────────────

export function signJWT(payload, secret) {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = b64url(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${sig}`;
}

export function verifyJWT(token, secret) {
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

function b64url(buf) {
  return Buffer.from(buf).toString('base64url');
}

// ── Session extraction ───────────────────────────────────────────────────────

export function getSession(req) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return { ok: false, reason: 'not_configured' };
  const token = parseCookie(req.headers.cookie, 'pt_session');
  const payload = verifyJWT(token, secret);
  if (!payload || !payload.sub) return { ok: false, reason: 'unauthenticated' };
  return { ok: true, payload };
}

// ── Owner check ──────────────────────────────────────────────────────────────

export function checkOwner(email) {
  if (!email) return false;
  const e = String(email).toLowerCase().trim();
  const fallback = ['liksen855@gmail.com'];
  const envList = (process.env.PATREON_OWNER_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  return [...fallback, ...envList].includes(e);
}

// ── CORS / cache helpers ─────────────────────────────────────────────────────

export function setCORS(res, opts = {}) {
  res.setHeader('Access-Control-Allow-Origin', opts.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', opts.methods || 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', opts.headers || 'Content-Type, Authorization');
  if (opts.credentials) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
}

export function setNoCache(res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
}

export function setShortCache(res, seconds = 60) {
  res.setHeader('Cache-Control', `public, max-age=${seconds}, s-maxage=${seconds}`);
}
