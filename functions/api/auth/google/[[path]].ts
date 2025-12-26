import type { RequestHandler, PagesFunctionContext, D1Database } from '../../../../src/types/cloudflare';

export const onRequest: RequestHandler = async (context: PagesFunctionContext) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/auth/google/', '');

  // OAuth initiation
  if (path === '' || path === 'login') {
    const redirectUri = `${env.APP_URL || url.origin}/api/auth/google/callback`;
    const clientId = env.GOOGLE_CLIENT_ID;
    const scope = 'openid email profile https://www.googleapis.com/auth/calendar';
    const state = crypto.randomUUID();

    // Store state in KV or session (simplified here)
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scope);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');

    return Response.redirect(authUrl.toString());
  }

  // OAuth callback
  if (path === 'callback') {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (error) {
      return Response.redirect(`${env.APP_URL || url.origin}/login?error=${error}`);
    }

    if (!code) {
      return Response.redirect(`${env.APP_URL || url.origin}/login?error=no_code`);
    }

    // Exchange code for tokens
    const redirectUri = `${env.APP_URL || url.origin}/api/auth/google/callback`;
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      return Response.redirect(`${env.APP_URL || url.origin}/login?error=token_exchange_failed`);
    }

    const tokens = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokens;

    // Get user info from Google
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!userResponse.ok) {
      return Response.redirect(`${env.APP_URL || url.origin}/login?error=user_info_failed`);
    }

    const userInfo = await userResponse.json();
    const { id: google_id, email, name } = userInfo;

    // Store or update user in database
    const userId = crypto.randomUUID();

    // Check if user exists
    const existingUser = await (env.DB as D1Database).prepare(
      'SELECT id FROM users WHERE google_id = ?'
    ).bind(google_id).first();

    if (existingUser) {
      // Update existing user
      await (env.DB as D1Database).prepare(
        `UPDATE users 
         SET email = ?, name = ?
         WHERE google_id = ?`
      ).bind(email, name, google_id).run();
    } else {
      // Create new user
      await (env.DB as D1Database).prepare(
        `INSERT INTO users (id, google_id, email, name)
         VALUES (?, ?, ?, ?)`
      ).bind(userId, google_id, email, name).run();
    }

    // Create JWT session token
    const sessionToken = await createSessionToken(userId, env.JWT_SECRET);

    // Redirect to dashboard with session
    const response = Response.redirect(`${env.APP_URL || url.origin}/dashboard`);
    response.headers.set('Set-Cookie', `session=${sessionToken}; HttpOnly; Secure; SameSite=Lax; Path=/`);
    return response;
  }

  return new Response('Not Found', { status: 404 });
};

async function createSessionToken(userId: string, secret: string): Promise<string> {
  // Simple JWT-like token (in production, use a proper JWT library)
  const payload = { userId, exp: Math.floor(Date.now() / 1000) + 86400 }; // 24 hours
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(payload));
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, data);
  return btoa(JSON.stringify(payload)) + '.' + btoa(String.fromCharCode(...new Uint8Array(signature)));
}

