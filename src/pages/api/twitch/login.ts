import type { APIRoute } from 'astro'

export const get: APIRoute = () => {
  const clientId = import.meta.env.TWITCH_CLIENT_ID!
  const redirect = encodeURIComponent(import.meta.env.TWITCH_REDIRECT_URI!)
  const scope = encodeURIComponent('channel:read:subscriptions')
  const url = [
    'https://id.twitch.tv/oauth2/authorize',
    `?response_type=code`,
    `&client_id=${clientId}`,
    `&redirect_uri=${redirect}`,
    `&scope=${scope}`,
  ].join('')
  return new Response(null, {
    status: 302,
    headers: { Location: url },
  })
}
