import { getStore } from '@netlify/blobs'

// In-memory cache for development and optimization
let storedRefreshToken: string | null = null
let storedAccessToken: string | null = null
let tokenExpiry: number | null = null

// Detect if we're in production (Netlify)
const isProduction = import.meta.env.PROD
const isDevelopment = !isProduction

// For production: use Netlify Blobs
const tokenStore = isProduction ? getStore('twitch-tokens') : null

interface TokenData {
  refreshToken?: string
  accessToken?: string
  expiresAt?: number
}

export async function getRefreshToken(): Promise<string> {
  if (storedRefreshToken) {
    return storedRefreshToken
  }

  if (isDevelopment) {
    const token = import.meta.env.TWITCH_REFRESH_TOKEN
    if (!token) {
      throw new Error('No refresh token available. Please authenticate first at /api/twitch/login')
    }
    storedRefreshToken = token
    return token
  } else {
    // In production, use Netlify Blobs
    try {
      const dataText = await tokenStore?.get('tokens')
      if (!dataText) {
        throw new Error('No refresh token found in storage. Please re-authenticate.')
      }
      const data = JSON.parse(dataText as string) as TokenData
      if (!data?.refreshToken) {
        throw new Error('No refresh token found in storage. Please re-authenticate.')
      }
      storedRefreshToken = data.refreshToken
      return data.refreshToken
    } catch (error) {
      throw new Error('Failed to retrieve refresh token from storage. Please re-authenticate.')
    }
  }
}

export async function setRefreshToken(token: string): Promise<void> {
  storedRefreshToken = token

  if (isProduction && tokenStore) {
    try {
      // Get existing data
      let existingData: TokenData = {}
      try {
        const existingText = await tokenStore.get('tokens')
        if (existingText) {
          existingData = JSON.parse(existingText as string) as TokenData
        }
      } catch {
        // If it doesn't exist or there's an error, use empty object
      }

      // Update with new refresh token
      const tokenData: TokenData = {
        ...existingData,
        refreshToken: token,
      }

      await tokenStore.set('tokens', JSON.stringify(tokenData))
    } catch (error) {
      console.error('Failed to save refresh token to storage:', error)
    }
  }
}

export async function setAccessToken(token: string, expiresIn: number): Promise<void> {
  storedAccessToken = token
  tokenExpiry = Date.now() + expiresIn * 1000 - 60000 // 1 minute buffer

  if (isProduction && tokenStore) {
    try {
      // Get existing data
      let existingData: TokenData = {}
      try {
        const existingText = await tokenStore.get('tokens')
        if (existingText) {
          existingData = JSON.parse(existingText as string) as TokenData
        }
      } catch {
        // If it doesn't exist or there's an error, use empty object
      }

      // Update with new access token
      const tokenData: TokenData = {
        ...existingData,
        accessToken: token,
        expiresAt: tokenExpiry,
      }

      await tokenStore.set('tokens', JSON.stringify(tokenData))
    } catch (error) {
      console.error('Failed to save access token to storage:', error)
    }
  }
}

export async function getStoredAccessToken(): Promise<string | null> {
  // Verify in-memory token first
  if (storedAccessToken && tokenExpiry && Date.now() < tokenExpiry) {
    return storedAccessToken
  }

  if (isProduction && tokenStore) {
    try {
      const dataText = await tokenStore.get('tokens')
      if (!dataText) {
        return null
      }
      const data = JSON.parse(dataText as string) as TokenData
      if (data?.accessToken && data?.expiresAt && Date.now() < data.expiresAt) {
        storedAccessToken = data.accessToken
        tokenExpiry = data.expiresAt
        return data.accessToken
      }
    } catch (error) {
      console.error('Failed to retrieve access token from storage:', error)
    }
  }

  return null
}
