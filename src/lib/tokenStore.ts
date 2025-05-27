import { getStore } from '@netlify/blobs'

// Cache en memoria para desarrollo y optimización
let storedRefreshToken: string | null = null
let storedAccessToken: string | null = null
let tokenExpiry: number | null = null

// Detectar si estamos en producción (Netlify)
const isProduction = import.meta.env.PROD
const isDevelopment = !isProduction

// Para producción: usa Netlify Blobs
const tokenStore = isProduction ? getStore('twitch-tokens') : null

interface TokenData {
  refreshToken?: string
  accessToken?: string
  expiresAt?: number
}

export async function getRefreshToken(): Promise<string> {
  // Primero intenta obtenerlo de memoria
  if (storedRefreshToken) {
    return storedRefreshToken
  }

  if (isDevelopment) {
    // En desarrollo, usa variables de entorno
    const token = import.meta.env.TWITCH_REFRESH_TOKEN
    if (!token) {
      throw new Error('No refresh token available. Please authenticate first at /api/twitch/login')
    }
    storedRefreshToken = token
    return token
  } else {
    // En producción, usa Netlify Blobs
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
      // Obtener datos existentes
      let existingData: TokenData = {}
      try {
        const existingText = await tokenStore.get('tokens')
        if (existingText) {
          existingData = JSON.parse(existingText as string) as TokenData
        }
      } catch {
        // Si no existe o hay error, usar objeto vacío
      }

      // Actualizar con el nuevo refresh token
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
  tokenExpiry = Date.now() + expiresIn * 1000 - 60000 // 1 minuto de buffer

  if (isProduction && tokenStore) {
    try {
      // Obtener datos existentes
      let existingData: TokenData = {}
      try {
        const existingText = await tokenStore.get('tokens')
        if (existingText) {
          existingData = JSON.parse(existingText as string) as TokenData
        }
      } catch {
        // Si no existe o hay error, usar objeto vacío
      }

      // Actualizar con el nuevo access token
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
  // Verificar token en memoria primero
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
