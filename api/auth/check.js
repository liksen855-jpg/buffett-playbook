// Validates the pt_session cookie. Called by the gated client page on load.
// Returns { authenticated: bool, name?, email? }.

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
  const [header, body, sig] = parts;
  const expected = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  // Constant-time compare
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch (_) {
    return null;
  }
}

export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  const { SESSION_SECRET } = process.env;
  if (!SESSION_SECRET) {
    res.status(200).json({ authenticated: false, reason: 'not_configured' });
    return;
  }
  const token = parseCookie(req.headers.cookie, 'pt_session');
  const payload = verifyJWT(token, SESSION_SECRET);
  if (payload) {
    res.status(200).json({ authenticated: true, name: payload.name, email: payload.email });
  } else {
    res.status(200).json({ authenticated: false });
  }
}
