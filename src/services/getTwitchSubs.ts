export const getTwitchSubs = async () => {
  const origin = import.meta.env.SITE ?? 'http://localhost:4321'

  const url = new URL('/api/twitch/subscribers', origin).toString()
  const res = await fetch(url)

  if (!res.ok) {
    throw new Error(`Error loading subscribers: ${res.status} ${await res.text()}`)
  }
  const data = await res.json()

  const subs = data.subscribers || []
  const cacheInfo = data._cache_info || {}

  return {
    subscribers: subs,
    cacheInfo,
  }
}
