// Utility to get Twitch user info from access token
export async function getTwitchUser(accessToken: string) {
  const res = await fetch('https://api.twitch.tv/helix/users', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Client-Id': import.meta.env.TWITCH_CLIENT_ID!,
    },
  })
  if (!res.ok) return null
  const data = await res.json()
  return data.data && data.data.length > 0 ? data.data[0] : null
}
