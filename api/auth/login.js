// Initiates Patreon OAuth 2.0 flow.
// Redirects the browser to patreon.com to grant access.
// Sets a short-lived state cookie for CSRF verification.

import crypto from 'node:crypto';

export default function handler(req, res) {
  const clientId = process.env.PATREON_CLIENT_ID;
  if (!clientId) {
    res.status(500).send('PATREON_CLIENT_ID not configured');
    return;
  }

  const host = req.headers.host || 'leiholding.com';
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const redirectUri = `${proto}://${host}/api/auth/callback`;

  // Scopes: identity = basic user info; identity.memberships = which campaigns they support
  const scope = 'identity identity.memberships';

  // CSRF state (random 16 bytes hex)
  const state = crypto.randomBytes(16).toString('hex');

  // Where to go after sign-in completes — pass through ?next=
  const next = (req.query?.next && /^\/[a-zA-Z0-9/_\-.]*$/.test(req.query.next)) ? req.query.next : '/stock-details';

  // Sign state-with-next so callback can verify both
  const statePayload = Buffer.from(JSON.stringify({ s: state, n: next })).toString('base64url');

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope,
    state: statePayload,
  });

  const authUrl = `https://www.patreon.com/oauth2/authorize?${params.toString()}`;

  // Cookie for state verification (10 minute lifetime)
  res.setHeader('Set-Cookie', `pt_state=${state}; HttpOnly; Path=/; Max-Age=600; SameSite=Lax; Secure`);
  res.writeHead(302, { Location: authUrl });
  res.end();
}
