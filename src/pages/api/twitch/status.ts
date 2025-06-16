import type { APIRoute } from 'astro'
import { getRefreshToken, getStoredAccessToken } from '@/lib/tokenStore'

export const prerender = false

export const GET: APIRoute = async () => {
  try {
    const isProduction = import.meta.env.PROD
    const environment = isProduction ? 'Production' : 'Development'

    // Check if we have refresh token
    let hasRefreshToken = false
    let refreshTokenSource = 'none'

    try {
      await getRefreshToken()
      hasRefreshToken = true
      refreshTokenSource = isProduction ? 'Netlify Blobs' : 'Environment Variables'
    } catch (err) {
      hasRefreshToken = false
    }

    // Check if we have valid access token
    const accessToken = await getStoredAccessToken()
    const hasValidAccessToken = !!accessToken

    // If we have refresh token, try to get an access token
    let canGetAccessToken = false
    let tokenError = null

    if (hasRefreshToken) {
      try {
        const testRes = await fetch(new URL('/api/twitch/subscribers', import.meta.env.SITE))
        canGetAccessToken = testRes.ok
        if (!testRes.ok) {
          const errorText = await testRes.text()
          tokenError = errorText
        }
      } catch (err: any) {
        tokenError = err.message
      }
    }

    const status = {
      environment,
      isProduction,
      hasRefreshToken,
      refreshTokenSource,
      hasValidAccessToken,
      canGetAccessToken,
      tokenError,
      nextSteps: [] as string[],
    }

    // Determine next steps
    if (!hasRefreshToken) {
      status.nextSteps.push('1. Visit /api/twitch/login to authenticate')
      status.nextSteps.push('2. Copy refresh_token to .env file')
    } else if (!canGetAccessToken) {
      status.nextSteps.push('1. Verify that refresh_token in .env is valid')
      status.nextSteps.push("2. If it doesn't work, re-authenticate at /api/twitch/login")
    } else {
      status.nextSteps.push('✅ All ready! You can use /api/twitch/subscribers')
    }

    return new Response(
      `
      <!DOCTYPE html>
        <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Twitch Integration Status</title>
        <style>
          body { font-family: sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
          .status { padding: 15px; margin: 10px 0; border-radius: 8px; }
          .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
          .warning { background: #fff3cd; color: #856404; border: 1px solid #ffeaa7; }
          .error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
          .info { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
          pre { background: #f8f9fa; padding: 10px; border-radius: 4px; overflow-x: auto; }
          .btn { display: inline-block; padding: 10px 15px; margin: 5px; text-decoration: none; 
                 border-radius: 4px; color: white; background: #007bff; }
          .btn:hover { background: #0056b3; }
        </style>
      </head>
      <body>
        <h1>🔧 Twitch Integration Status</h1>
        
        <div class="status ${hasRefreshToken ? 'success' : 'error'}">
          <strong>Refresh Token:</strong> ${hasRefreshToken ? '✅ Available' : '❌ Not found'}
        </div>
        
        <div class="status ${hasValidAccessToken ? 'success' : 'warning'}">
          <strong>Access Token:</strong> ${hasValidAccessToken ? '✅ Valid in memory' : '⚠️ No valid token in memory'}
        </div>
        
        <div class="status ${canGetAccessToken ? 'success' : 'error'}">
          <strong>API Functional:</strong> ${canGetAccessToken ? '✅ Can get subscribers' : '❌ Error getting data'}
        </div>
        
        ${
          tokenError
            ? `
        <div class="status error">
          <strong>Error Details:</strong><br>
          <pre>${tokenError}</pre>
        </div>
        `
            : ''
        }
        
        <h2>📋 Siguientes pasos:</h2>
        <ul>
          ${status.nextSteps.map((step) => `<li>${step}</li>`).join('')}
        </ul>
        
        <h2>🔗 Enlaces útiles:</h2>
        <a href="/api/twitch/login" class="btn">🔐 Autenticar con Twitch</a>
        <a href="/api/twitch/subscribers" class="btn">📊 Ver Suscriptores</a>
        
        <h2>🔍 Debug Info:</h2>
        <pre>${JSON.stringify(status, null, 2)}</pre>
      </body>
      </html>
    `,
      {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      },
    )
  } catch (err: any) {
    return new Response(`Error: ${err.message}`, { status: 500 })
  }
}
