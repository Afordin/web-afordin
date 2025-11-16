export const getTwitchSubs = async () => {
  // Return mock data in development mode
  if (!import.meta.env.PROD) {
    return {
      subscribers: [
        {
          user_id: '1',
          user_name: 'mock_subscriber_1',
          display_name: 'Mock Subscriber 1',
          profile_image_url:
            'https://static-cdn.jtvnw.net/user-default-pictures-uv/ebe4cd89-b4f4-4cd9-adac-2f30151b4209-profile_image-300x300.png',
        },
        {
          user_id: '2',
          user_name: 'mock_subscriber_2',
          display_name: 'Mock Subscriber 2',
          profile_image_url:
            'https://static-cdn.jtvnw.net/user-default-pictures-uv/ebe4cd89-b4f4-4cd9-adac-2f30151b4209-profile_image-300x300.png',
        },
        {
          user_id: '3',
          user_name: 'mock_subscriber_3',
          display_name: 'Mock Subscriber 3',
          profile_image_url:
            'https://static-cdn.jtvnw.net/user-default-pictures-uv/ebe4cd89-b4f4-4cd9-adac-2f30151b4209-profile_image-300x300.png',
        },
      ],
      cacheInfo: {
        hit: false,
        age: 0,
        maxAge: 300,
      },
    }
  }

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
