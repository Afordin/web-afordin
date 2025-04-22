import { setRefreshToken } from '@/lib/tokenStore'
import type { APIRoute } from 'astro'

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  if (!code) {
    return new Response('Falta el código de Twitch', { status: 400 })
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
    return new Response(`Error token: ${tokenRes.status} – ${err}`, { status: 502 })
  }
  const { access_token, refresh_token } = await tokenRes.json()

  await setRefreshToken(refresh_token)

  return new Response('¡Autorización completada! Ya puedes cerrar esta ventana.', {
    status: 200,
    headers: { 'Content-Type': 'text/plain' },
  })
}
