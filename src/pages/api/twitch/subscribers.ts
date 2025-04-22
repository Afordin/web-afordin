import { getRefreshToken } from '@/lib/tokenStore'
import type { APIRoute } from 'astro'

async function fetchAccessToken() {
  const refresh_token = await getRefreshToken()

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token,
    client_id: import.meta.env.TWITCH_CLIENT_ID!,
    client_secret: import.meta.env.TWITCH_CLIENT_SECRET!,
  })

  const res = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Error refrescando token: ${res.status} – ${txt}`)
  }
  const { access_token } = await res.json()
  return access_token as string
}

export const get: APIRoute = async () => {
  let token: string
  try {
    token = await fetchAccessToken()
  } catch (err: any) {
    return new Response(`Token refresh failed: ${err.message}`, { status: 500 })
  }

  const validate = await fetch('https://id.twitch.tv/oauth2/validate', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!validate.ok) {
    return new Response('Invalid access token', { status: 401 })
  }
  const { user_id } = await validate.json()

  const url = new URL('https://api.twitch.tv/helix/subscriptions')
  url.searchParams.set('broadcaster_id', user_id)
  url.searchParams.set('first', '100')

  const subsRes = await fetch(url.toString(), {
    headers: {
      'Client-Id': import.meta.env.TWITCH_CLIENT_ID!,
      Authorization: `Bearer ${token}`,
    },
  })
  if (!subsRes.ok) {
    const err = await subsRes.text()
    return new Response(`Twitch API error: ${subsRes.status} – ${err}`, { status: 502 })
  }

  const { data } = await subsRes.json()
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
