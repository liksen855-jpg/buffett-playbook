// Receives the OAuth code from Patreon, exchanges it for an access token,
// fetches the user's identity + memberships, verifies they are an active
// PAID member of the configured campaign, and sets a signed session cookie.
//
// REFACTORED: Uses shared auth utilities. Owner email is now ONLY from env var.

import { parseCookie, signJWT } from '../lib/auth.js';
import { checkRateLimit, rateLimitHeaders } from '../lib/rate-limit.js';

export default async function handler(req, res) {
  const {
    PATREON_CLIENT_ID,
    PATREON_CLIENT_SECRET,
    PATREON_CAMPAIGN_ID,
    SESSION_SECRET,
  } = process.env;

  if (!PATREON_CLIENT_ID || !PATREON_CLIENT_SECRET || !PATREON_CAMPAIGN_ID || !SESSION_SECRET) {
    res.status(500).send('Auth not configured. Set PATREON_CLIENT_ID, PATREON_CLIENT_SECRET, PATREON_CAMPAIGN_ID, and SESSION_SECRET as environment variables.');
    return;
  }

  const rl = checkRateLimit(req, { maxReqs: 30 });
  rateLimitHeaders(res, rl);
  if (!rl.allowed) {
    res.status(429).json({ error: 'Rate limit exceeded', retryAfter: rl.retryAfter });
    return;
  }

  const code = req.query?.code;
  const stateRaw = req.query?.state;
  if (!code || !stateRaw) {
    res.status(400).send('Missing code or state');
    return;
  }

  // Verify CSRF state against the cookie set in login.js
  let stateInfo;
  try {
    stateInfo = JSON.parse(Buffer.from(stateRaw, 'base64url').toString());
  } catch (_) {
    res.status(400).send('Malformed state');
    return;
  }
  const stateCookie = parseCookie(req.headers.cookie, 'pt_state');
  if (!stateInfo.s || stateInfo.s !== stateCookie) {
    res.status(400).send('State mismatch — please retry sign-in.');
    return;
  }

  const host = req.headers.host || 'leiholding.com';
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const redirectUri = `${proto}://${host}/api/auth/callback`;

  // 1) Exchange code → access token
  let tokenData;
  try {
    const r = await fetch('https://www.patreon.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        client_id: PATREON_CLIENT_ID,
        client_secret: PATREON_CLIENT_SECRET,
        redirect_uri: redirectUri,
      }),
    });
    tokenData = await r.json();
  } catch (e) {
    res.status(502).send('Token exchange failed');
    return;
  }
  const accessToken = tokenData.access_token;
  if (!accessToken) {
    res.status(401).send('Patreon refused token exchange');
    return;
  }

  // 2) Fetch identity + memberships
  const fieldsMember = 'patron_status,currently_entitled_amount_cents';
  const fieldsUser = 'full_name,email';
  const identUrl =
    'https://www.patreon.com/api/oauth2/v2/identity' +
    '?include=memberships,memberships.campaign' +
    `&fields%5Bmember%5D=${encodeURIComponent(fieldsMember)}` +
    `&fields%5Buser%5D=${encodeURIComponent(fieldsUser)}`;
  let ident;
  try {
    const r = await fetch(identUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
    ident = await r.json();
  } catch (e) {
    res.status(502).send('Patreon identity lookup failed');
    return;
  }

  // 3) Owner bypass: ONLY from env var (no hardcoded fallback)
  const ownerEmails = (process.env.PATREON_OWNER_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  const userEmail = (ident.data?.attributes?.email || '').toLowerCase();
  const isOwner = userEmail && ownerEmails.includes(userEmail);

  // 4) Check for a paid, active membership of OUR campaign
  const members = (ident.included || []).filter(it => it.type === 'member');
  const validMember = members.find(m => {
    const status = m.attributes?.patron_status;
    const cents = m.attributes?.currently_entitled_amount_cents || 0;
    const campaignId = m.relationships?.campaign?.data?.id;
    return status === 'active_patron' && cents > 0 && String(campaignId) === String(PATREON_CAMPAIGN_ID);
  });

  if (!validMember && !isOwner) {
    let reason = 'no_membership_found';
    let detail = '';
    if (members.length) {
      const ours = members.filter(m => String(m.relationships?.campaign?.data?.id) === String(PATREON_CAMPAIGN_ID));
      if (!ours.length) {
        reason = 'membership_other_campaign';
        detail = 'campaigns=' + members.map(m => m.relationships?.campaign?.data?.id || '?').join(',');
      } else {
        const m = ours[0];
        reason = 'inactive_or_unpaid';
        detail = `status=${m.attributes?.patron_status || 'none'};cents=${m.attributes?.currently_entitled_amount_cents || 0}`;
      }
    }
    const qp = new URLSearchParams({
      reason, detail,
      email: userEmail || '(none)',
      campaign: String(PATREON_CAMPAIGN_ID),
      members: String(members.length),
    });
    res.writeHead(302, { Location: '/not-a-patron?' + qp.toString() });
    res.end();
    return;
  }

  // 5) Mint session JWT (7 days)
  const name = ident.data?.attributes?.full_name || 'Patron';
  const email = ident.data?.attributes?.email || '';
  const payload = {
    sub: ident.data?.id,
    name,
    email,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 3600,
  };
  const jwt = signJWT(payload, SESSION_SECRET);

  // 6) Set cookie + clear state cookie + redirect
  res.setHeader('Set-Cookie', [
    `pt_session=${jwt}; HttpOnly; Path=/; Max-Age=${7 * 24 * 3600}; SameSite=Lax; Secure`,
    `pt_state=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax; Secure`,
  ]);
  const next = (stateInfo.n && /^\/[a-zA-Z0-9/_\-.]*$/.test(stateInfo.n)) ? stateInfo.n : '/stock-details';
  res.writeHead(302, { Location: next });
  res.end();
}
