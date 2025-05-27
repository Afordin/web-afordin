import { getRefreshToken, getStoredAccessToken, setAccessToken } from '@/lib/tokenStore'
import { getCachedSubscribers, setCachedSubscribers, getCacheInfo } from '@/lib/subscribersCache'
import type { APIRoute } from 'astro'

export const prerender = false

// Utility to split into chunks of 100
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

async function fetchAccessToken(): Promise<string> {
  // First check if we already have a valid token in memory
  const storedToken = await getStoredAccessToken()
  if (storedToken) {
    return storedToken
  }

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
    console.error('Error refreshing token:', { status: res.status, body: txt })
    throw new Error(`Error refreshing token: ${res.status} – ${txt}`)
  }

  const { access_token, expires_in } = await res.json()

  // Save the new token
  await setAccessToken(access_token, expires_in || 3600)

  return access_token as string
}

export const GET: APIRoute = async ({ request }) => {
  // Check if we have valid cached data
  const cachedData = getCachedSubscribers()
  const cacheInfo = getCacheInfo()

  // If there's a 'force=true' parameter, skip cache
  const requestUrl = new URL(request.url)
  const forceRefresh = requestUrl.searchParams.get('force') === 'true'

  if (cachedData && !forceRefresh) {
    return new Response(
      JSON.stringify({
        ...cachedData,
        _cache_info: {
          from_cache: true,
          cached_at: new Date(cachedData.cached_at).toISOString(),
          remaining_time_ms: cacheInfo.remainingTime,
        },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60', // Cache in browser for 1 minute
        },
      },
    )
  }

  let token: string
  try {
    token = await fetchAccessToken()
  } catch (err: any) {
    // If token fails but we have cache (even if expired), return cache
    if (cachedData) {
      return new Response(
        JSON.stringify({
          ...cachedData,
          _cache_info: {
            from_cache: true,
            stale: true,
            error: 'Token refresh failed, serving stale data',
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }
    return new Response(`Token refresh failed: ${err.message}`, { status: 500 })
  }

  // Validate token and extract user_id
  const validate = await fetch('https://id.twitch.tv/oauth2/validate', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!validate.ok) {
    return new Response('Invalid access token', { status: 401 })
  }

  const { user_id, ...rest } = await validate.json()

  // Get all subscribers using pagination
  let allSubs: any[] = []
  let cursor: string | undefined = undefined
  let hasMore = true

  while (hasMore) {
    const url = new URL('https://api.twitch.tv/helix/subscriptions')
    url.searchParams.set('broadcaster_id', user_id)
    url.searchParams.set('first', '100')

    if (cursor) {
      url.searchParams.set('after', cursor)
    }

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

    const { data: subs, pagination } = await subsRes.json()

    allSubs = allSubs.concat(subs)

    // Check if there are more pages
    cursor = pagination?.cursor
    hasMore = !!cursor && subs.length === 100
  }

  // Extract subscriber IDs
  const userIds = allSubs.map((sub: any) => sub.user_id)
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

  // Merge subscription data with profile images
  const enrichedSubs = allSubs.map((sub: any) => ({
    ...sub,
    profile_image_url: enrichedUsers[sub.user_id]?.profile_image_url ?? null,
    display_name: enrichedUsers[sub.user_id]?.display_name ?? sub.user_name,
  }))

  // Create response object
  const responseData = {
    user_id,
    ...rest,
    subscribers: enrichedSubs,
    total_count: enrichedSubs.length,
  }

  // Save to cache
  setCachedSubscribers(responseData)

  return new Response(
    JSON.stringify({
      ...responseData,
      _cache_info: {
        from_cache: false,
        cached_at: new Date().toISOString(),
      },
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60', // Cache in browser for 1 minute
      },
    },
  )
}
