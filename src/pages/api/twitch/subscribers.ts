import { getRefreshToken } from '@/lib/tokenStore'
import type { APIRoute } from 'astro'

export const prerender = false

// Utilidad para dividir en bloques de 100
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

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

export const GET: APIRoute = async () => {
  let token: string
  try {
    token = await fetchAccessToken()
  } catch (err: any) {
    return new Response(`Token refresh failed: ${err.message}`, { status: 500 })
  }

  // Validamos el token y extraemos el user_id
  const validate = await fetch('https://id.twitch.tv/oauth2/validate', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!validate.ok) {
    return new Response('Invalid access token', { status: 401 })
  }

  const { user_id } = await validate.json()

  // Obtenemos los suscriptores
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

  const { data: subs } = await subsRes.json()

  // Extraemos los IDs de los suscriptores
  const userIds = subs.map((sub: any) => sub.user_id)
  const chunks = chunkArray(userIds, 100)

  const enrichedUsers: Record<string, any> = {}

  for (const chunk of chunks) {
    const usersUrl = new URL('https://api.twitch.tv/helix/users')
    chunk.forEach((id: any) => usersUrl.searchParams.append('id', id))

    const usersRes = await fetch(usersUrl.toString(), {
      headers: {
        'Client-Id': import.meta.env.TWITCH_CLIENT_ID!,
        Authorization: `Bearer ${token}`,
      },
    })

    if (!usersRes.ok) continue

    const { data: users } = await usersRes.json()
    users.forEach((user: any) => {
      enrichedUsers[user.id] = user
    })
  }

  // Mezclamos los datos de suscripción con las imágenes de perfil
  const enrichedSubs = subs.map((sub: any) => ({
    ...sub,
    profile_image_url: enrichedUsers[sub.user_id]?.profile_image_url ?? null,
    display_name: enrichedUsers[sub.user_id]?.display_name ?? sub.user_name,
  }))

  return new Response(JSON.stringify(enrichedSubs), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
