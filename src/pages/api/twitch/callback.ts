import type { APIRoute } from 'astro'
import { setRefreshToken, setAccessToken } from '@/lib/tokenStore'

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')

  if (error) {
    return new Response(`Twitch auth error: ${error}`, { status: 400 })
  }

  if (!code) {
    return new Response('Missing Twitch code', { status: 400 })
  }

  const params = new URLSearchParams({
    client_id: import.meta.env.TWITCH_CLIENT_ID!,
    client_secret: import.meta.env.TWITCH_CLIENT_SECRET!,
    code,
    grant_type: 'authorization_code',
    redirect_uri: import.meta.env.TWITCH_REDIRECT_URI!,
  })

  const tokenRes = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  })

  if (!tokenRes.ok) {
    const err = await tokenRes.text()
    return new Response(`Error getting token: ${tokenRes.status} – ${err}`, { status: 502 })
  }

  const { access_token, refresh_token, expires_in, scope } = await tokenRes.json()

  // Validate that we have the necessary scopes
  const requiredScopes = ['channel:read:subscriptions']
  const missingScopes = requiredScopes.filter((s) => !scope.includes(s))

  if (missingScopes.length > 0) {
    return new Response(`Missing permissions: ${missingScopes.join(', ')}`, { status: 403 })
  }

  // Save tokens in memory
  await setRefreshToken(refresh_token)
  await setAccessToken(access_token, expires_in)

  return new Response(
    `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Twitch Auth Exitosa</title>
      <style>
        body { font-family: sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
        .success { color: green; }
        .token { background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 4px; word-break: break-all; }
      </style>
    </head>
    <body>
      <h1 class="success">✅ Autenticación exitosa</h1>
      <p>Tokens obtenidos correctamente. Ya puedes usar el endpoint de suscriptores.</p>
      <div>
        <strong>Refresh Token:</strong>
        <div class="token">${refresh_token}</div>
        <small>Guarda este token en tu archivo .env como TWITCH_REFRESH_TOKEN</small>
      </div>
      <div>
        <strong>Scopes concedidos:</strong> ${JSON.stringify(scope)}
      </div>
      <p><a href="/api/twitch/subscribers">🔗 Probar endpoint de suscriptores</a></p>
    </body>
    </html>
  `,
    {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    },
  )
}
