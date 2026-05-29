// Clears the session cookie and redirects home.

export default function handler(req, res) {
  res.setHeader('Set-Cookie', `pt_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax; Secure`);
  res.writeHead(302, { Location: '/' });
  res.end();
}
