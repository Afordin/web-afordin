export async function getRefreshToken(): Promise<string> {
  const token = import.meta.env.TWITCH_REFRESH_TOKEN
  if (!token) throw new Error('No refresh token set in environment')
  return token
}
