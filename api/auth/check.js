// Validates the pt_session cookie. Refactored to use shared auth utilities.

import { getSession, setNoCache } from '../lib/auth.js';
import { checkRateLimit, rateLimitHeaders } from '../lib/rate-limit.js';

export default function handler(req, res) {
  setNoCache(res);

  const rl = checkRateLimit(req, { maxReqs: 120 });
  rateLimitHeaders(res, rl);
  if (!rl.allowed) {
    res.status(429).json({ error: 'Rate limit exceeded', retryAfter: rl.retryAfter });
    return;
  }

  const session = getSession(req);
  if (session.ok) {
    res.status(200).json({ authenticated: true, name: session.payload.name, email: session.payload.email });
  } else {
    res.status(200).json({ authenticated: false, reason: session.reason });
  }
}
