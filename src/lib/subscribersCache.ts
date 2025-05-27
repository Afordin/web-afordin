// Twitch subscribers cache system
// Prevents rate limiting and improves performance

interface SubscriberData {
  user_id: string
  subscribers: any[]
  total_count: number
  cached_at: number
  expires_at: number
}

// In-memory cache
let cachedSubscribers: SubscriberData | null = null

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
const STALE_WHILE_REVALIDATE = 10 * 60 * 1000 // 10 minutes

export function getCachedSubscribers(): SubscriberData | null {
  if (!cachedSubscribers) {
    return null
  }

  const now = Date.now()

  // If it's expired, don't return it
  if (now > cachedSubscribers.expires_at) {
    cachedSubscribers = null
    return null
  }

  return cachedSubscribers
}

export function setCachedSubscribers(data: { user_id: string; subscribers: any[]; total_count: number }): void {
  const now = Date.now()

  cachedSubscribers = {
    ...data,
    cached_at: now,
    expires_at: now + CACHE_DURATION,
  }
}

export function getCacheInfo(): {
  hasCachedData: boolean
  isExpired: boolean
  isStale: boolean
  remainingTime: number | null
} {
  if (!cachedSubscribers) {
    return {
      hasCachedData: false,
      isExpired: true,
      isStale: true,
      remainingTime: null,
    }
  }

  const now = Date.now()
  const isExpired = now > cachedSubscribers.expires_at
  const isStaleData = now > cachedSubscribers.cached_at + STALE_WHILE_REVALIDATE
  const remainingTime = Math.max(0, cachedSubscribers.expires_at - now)

  return {
    hasCachedData: true,
    isExpired,
    isStale: isStaleData,
    remainingTime,
  }
}
