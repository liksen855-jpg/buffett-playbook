/**
 * Simple in-memory rate limiter for Vercel serverless functions.
 * Uses a sliding window per IP address.
 * 
 * NOTE: In-memory means limits reset on cold start. For production scale,
 * replace with Redis-backed rate limiting.
 */

const windows = new Map();

const DEFAULT_WINDOW_MS = 60_000;   // 1 minute
const DEFAULT_MAX_REQS  = 60;       // 60 requests per minute

function now() { return Date.now(); }

function cleanOld() {
  const cutoff = now() - DEFAULT_WINDOW_MS * 2;
  for (const [ip, rec] of windows) {
    rec.times = rec.times.filter(t => t > cutoff);
    if (rec.times.length === 0) windows.delete(ip);
  }
}

// Periodic cleanup every 5 minutes
if (typeof globalThis !== 'undefined' && !globalThis._rlCleaner) {
  globalThis._rlCleaner = setInterval(cleanOld, 300_000);
}

export function checkRateLimit(req, opts = {}) {
  const windowMs = opts.windowMs || DEFAULT_WINDOW_MS;
  const maxReqs  = opts.maxReqs  || DEFAULT_MAX_REQS;

  // Get client IP from Vercel headers or fallback
  const ip = req.headers['x-forwarded-for']
    || req.headers['x-real-ip']
    || req.socket?.remoteAddress
    || 'unknown';

  const key = String(ip).split(',')[0].trim();
  const t = now();

  let rec = windows.get(key);
  if (!rec) { rec = { times: [] }; windows.set(key, rec); }

  // Remove entries outside window
  rec.times = rec.times.filter(ts => t - ts < windowMs);

  if (rec.times.length >= maxReqs) {
    const oldest = rec.times[0];
    const retryAfter = Math.ceil((oldest + windowMs - t) / 1000);
    return { allowed: false, retryAfter, remaining: 0 };
  }

  rec.times.push(t);
  return { allowed: true, remaining: maxReqs - rec.times.length - 1 };
}

export function rateLimitHeaders(res, result) {
  res.setHeader('X-RateLimit-Limit', String(result.limit || 60));
  res.setHeader('X-RateLimit-Remaining', String(Math.max(0, result.remaining)));
  if (!result.allowed) {
    res.setHeader('Retry-After', String(result.retryAfter));
  }
}
