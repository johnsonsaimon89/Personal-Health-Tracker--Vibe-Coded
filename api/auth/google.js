// api/auth/google.js
// Handles Google OAuth2 token exchange
// User is redirected here after approving Google permissions

export default async function handler(req, res) {
  const origin = process.env.ALLOWED_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { code } = req.query;

  if (!code) {
    return res.status(400).send('Missing OAuth code');
  }

  try {
    // Exchange auth code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id:     process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri:  process.env.GOOGLE_REDIRECT_URI,
        grant_type:    'authorization_code',
      }),
    });

    const tokens = await tokenRes.json();

    if (tokens.error) {
      return res.status(400).send(`OAuth error: ${tokens.error_description}`);
    }

    // Send tokens back to the frontend via a redirect with hash params
    // (keeps tokens out of server logs)
    const frontendUrl = process.env.ALLOWED_ORIGIN || '/';
    const params = new URLSearchParams({
      access_token:  tokens.access_token,
      refresh_token: tokens.refresh_token || '',
      expires_in:    tokens.expires_in,
    });

    return res.redirect(`${frontendUrl}/#${params.toString()}`);
  } catch (err) {
    console.error('OAuth error:', err);
    return res.status(500).send('OAuth exchange failed');
  }
}
