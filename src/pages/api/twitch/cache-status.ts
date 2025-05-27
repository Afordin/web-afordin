import { getCacheInfo } from '@/lib/subscribersCache'
import type { APIRoute } from 'astro'

export const prerender = false

export const GET: APIRoute = async () => {
  const cacheInfo = getCacheInfo()

  return new Response(
    JSON.stringify({
      cache_status: cacheInfo,
      recommendations: {
        should_refresh: cacheInfo.isStale || !cacheInfo.hasCachedData,
        use_cache: cacheInfo.hasCachedData && !cacheInfo.isExpired,
        force_refresh_url: '/api/twitch/subscribers?force=true',
      },
      timing: {
        cache_duration_minutes: 5,
        stale_threshold_minutes: 10,
        remaining_time_formatted: cacheInfo.remainingTime
          ? `${Math.floor(cacheInfo.remainingTime / 60000)}m ${Math.floor((cacheInfo.remainingTime % 60000) / 1000)}s`
          : 'N/A',
      },
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  )
}
