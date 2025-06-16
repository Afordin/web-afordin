# Documentación API de Twitch

Esta documentación describe todos los endpoints disponibles para la integración con Twitch en el proyecto web-afordin.

## Tabla de Contenidos

- [Configuración Inicial](#configuración-inicial)
- [Variables de Entorno](#variables-de-entorno)
- [Endpoints](#endpoints)
  - [/api/twitch/login](#apitwitchlogin)
  - [/api/twitch/callback](#apitwitchcallback)
  - [/api/twitch/subscribers](#apitwitchsubscribers)
  - [/api/twitch/status](#apitwitchstatus)
  - [/api/twitch/cache-status](#apitwitchcache-status)
- [Sistema de Cache](#sistema-de-cache)
- [Gestión de Tokens](#gestión-de-tokens)
- [Flujo de Autenticación](#flujo-de-autenticación)

---

## Configuración Inicial

### Variables de Entorno

Configura las siguientes variables de entorno en tu archivo `.env`:

```env
# Obligatorias
TWITCH_CLIENT_ID=tu_client_id_de_twitch
TWITCH_CLIENT_SECRET=tu_client_secret_de_twitch
TWITCH_REDIRECT_URI=http://localhost:4321/api/twitch/callback

# Opcional para desarrollo (se obtiene automáticamente tras autenticación)
TWITCH_REFRESH_TOKEN=tu_refresh_token

```

### Permisos Necesarios

El sistema requiere los siguientes scopes de Twitch:
- `channel:read:subscriptions` - Para leer la lista de suscriptores del canal

---

## Endpoints

### `/api/twitch/login`

**Método:** `GET`

**Descripción:** Inicia el flujo de autenticación OAuth2 con Twitch. Redirige automáticamente al usuario a la página de autorización de Twitch.

#### Uso
```bash
GET /api/twitch/login
```

#### Respuesta
- **Código 302**: Redirección automática a Twitch
- **Headers**: `Location: https://id.twitch.tv/oauth2/authorize?response_type=code&client_id=...`

#### Ejemplo de uso
```javascript
// Redirigir desde JavaScript
window.location.href = '/api/twitch/login';

// O simplemente usar un enlace
<a href="/api/twitch/login">Conectar con Twitch</a>
```

---

### `/api/twitch/callback`

**Método:** `GET`

**Descripción:** Endpoint de callback para OAuth2. Twitch redirige aquí tras la autorización del usuario. Procesa el código de autorización y obtiene los tokens necesarios.

#### Parámetros Query
- `code` (string): Código de autorización de Twitch
- `error` (string, opcional): Error si la autorización falló

#### Respuestas

**Éxito (200):**
```html
<!DOCTYPE html>
<html>
  <head>
    <title>Twitch Auth Exitosa</title>
  </head>
  <body>
    <h1>✅ Autenticación exitosa</h1>
    <p>Tokens obtenidos correctamente.</p>
    <div>
      <strong>Refresh Token:</strong>
      <div class="token">qkstc5zyjeiphutuzspuyxv56g3qw72...</div>
      <small>Guarda este token en tu archivo .env como TWITCH_REFRESH_TOKEN</small>
    </div>
    <p><a href="/api/twitch/subscribers">🔗 Probar endpoint de suscriptores</a></p>
  </body>
</html>
```

**Error (400):**
```text
Twitch auth error: access_denied
```

**Error (502):**
```text
Error obteniendo token: 400 – Invalid authorization code
```

#### Proceso interno
1. Valida el código de autorización
2. Intercambia código por access_token y refresh_token
3. Verifica permisos de `channel:read:subscriptions`
4. Guarda tokens en el sistema
5. Muestra página de confirmación

---

### `/api/twitch/subscribers`

**Método:** `GET`

**Descripción:** **Endpoint principal** que obtiene la lista completa de suscriptores del canal con información enriquecida. Incluye sistema de cache inteligente y manejo automático de tokens.

#### Parámetros Query
- `force` (string, opcional): Si es `"true"`, omite cache y hace nueva consulta

#### Respuestas

**Éxito (200):**
```json
{
  "user_id": "123456789",
  "client_id": "mr0y1dekls9ofruiuf5d7qx1apzppz",
  "login": "afordin",
  "scopes": ["channel:read:subscriptions"],
  "subscribers": [
    {
      "broadcaster_id": "123456789",
      "broadcaster_login": "afordin", 
      "broadcaster_name": "Afordin",
      "gifter_id": null,
      "gifter_login": null,
      "gifter_name": null,
      "is_gift": false,
      "plan_name": "Channel Subscription (afordin)",
      "tier": "1000",
      "user_id": "987654321",
      "user_name": "subscriber_user",
      "user_login": "subscriber_user",
      "profile_image_url": "https://static-cdn.jtvnw.net/jtv_user_pictures/...",
      "display_name": "Subscriber Name"
    }
  ],
  "total_count": 42,
  "_cache_info": {
    "from_cache": false,
    "cached_at": "2025-05-27T10:30:00.000Z"
  }
}
```

**Con cache (200):**
```json
{
  // ... misma estructura de datos ...
  "_cache_info": {
    "from_cache": true,
    "cached_at": "2025-05-27T10:25:00.000Z",
    "remaining_time_ms": 180000
  }
}
```

**Error de token (500):**
```text
Token refresh failed: Invalid refresh token
```

**Error de Twitch API (502):**
```text
Twitch API error: 429 – Rate limit exceeded
```

#### Características avanzadas
- **Cache inteligente**: 5 minutos de duración, 20 minutos stale
- **Fallback resiliente**: Sirve datos stale si falla el refresh
- **Enrichment de datos**: Combina suscripciones con perfiles de usuario
- **Procesamiento por chunks**: Maneja múltiples usuarios (hasta 100 por request)
- **Headers optimizados**: `Cache-Control: public, max-age=60`

#### Ejemplos de uso
```javascript
// Uso básico
const subs = await fetch('/api/twitch/subscribers');
const data = await subs.json();
console.log(`Total suscriptores: ${data.total_count}`);

// Forzar actualización
const fresh = await fetch('/api/twitch/subscribers?force=true');

// Verificar si vienen del cache
if (data._cache_info.from_cache) {
  console.log('Datos del cache, edad:', data._cache_info.cached_at);
}
```

---

### `/api/twitch/status`

**Método:** `GET`

**Descripción:** Página de diagnóstico completa que muestra el estado actual de toda la integración con Twitch. Ideal para debugging y verificación de configuración.

#### Respuesta (200)
```html
<!DOCTYPE html>
<html>
  <head>
    <title>Twitch Integration Status</title>
  </head>
  <body>
    <h1>🔧 Twitch Integration Status</h1>
    
    <div class="status success">
      <strong>Refresh Token:</strong> ✅ Disponible
    </div>
    
    <div class="status success">  
      <strong>Access Token:</strong> ✅ Válido en memoria
    </div>
    
    <div class="status success">
      <strong>API Funcional:</strong> ✅ Puede obtener suscriptores
    </div>
    
    <h2>📋 Siguientes pasos:</h2>
    <ul>
      <li>✅ Todo listo! Puedes usar /api/twitch/subscribers</li>
    </ul>
    
    <h2>🔗 Enlaces útiles:</h2>
    <a href="/api/twitch/login">🔐 Autenticar con Twitch</a>
    <a href="/api/twitch/subscribers">📊 Ver Suscriptores</a>
  </body>
</html>
```

#### Estados posibles
- **✅ Todo funcionando**: Tokens válidos y API respondiendo
- **⚠️ Necesita refresh**: Token en memoria expirado
- **❌ Necesita autenticación**: Sin refresh token
- **🔧 Error de configuración**: Variables de entorno faltantes

---

### `/api/twitch/cache-status`

**Método:** `GET`

**Descripción:** API JSON que proporciona información detallada sobre el estado del sistema de cache de suscriptores.

#### Respuesta (200)
```json
{
  "cache_status": {
    "hasCachedData": true,
    "isExpired": false,
    "isStale": false,
    "cacheAge": 120000,
    "remainingTime": 180000
  },
  "recommendations": {
    "should_refresh": false,
    "use_cache": true,
    "force_refresh_url": "/api/twitch/subscribers?force=true"
  },
  "timing": {
    "cache_duration_minutes": 5,
    "stale_threshold_minutes": 20,
    "remaining_time_formatted": "3m 0s"
  }
}
```

#### Propiedades importantes
- `hasCachedData`: Si existe información en cache
- `isExpired`: Si el cache ya no es válido (>5 min)
- `isStale`: Si está obsoleto pero utilizable (>20 min)
- `remainingTime`: Milisegundos hasta expiración

#### Casos de uso
```javascript
// Verificar estado del cache antes de hacer request
const cacheStatus = await fetch('/api/twitch/cache-status');
const status = await cacheStatus.json();

if (status.recommendations.should_refresh) {
  // Hacer request con force=true
  fetch('/api/twitch/subscribers?force=true');
} else {
  // Usar cache normal
  fetch('/api/twitch/subscribers');
}
```

---

## Sistema de Cache

### Configuración actual
```javascript
const CACHE_DURATION = 5 * 60 * 1000;      // 5 minutos válido
const STALE_WHILE_REVALIDATE = 20 * 60 * 1000; // 20 minutos stale
```

### Comportamiento del cache
1. **Fresh (0-5 min)**: Servido inmediatamente desde memoria
2. **Expired (5-20 min)**: Nueva consulta a Twitch API
3. **Stale (>20 min)**: Cache inválido, siempre consulta API
4. **Error fallback**: Si falla API pero hay cache stale, lo sirve

### Ventajas
- **Reducción de rate limits**: Evita llamadas innecesarias a Twitch
- **Mejor performance**: Respuesta instantánea con cache
- **Resilencia**: Fallback automático en caso de errores
- **Transparencia**: Headers `_cache_info` informan el estado

---

## Gestión de Tokens

### En desarrollo (.env)
```env
TWITCH_REFRESH_TOKEN=qkstc5zyjeiphutuzspuyxv56g3qw72eh9w07h9i9zzefdzxht
```

### En producción (Netlify Blobs)
- Almacenamiento persistente en Netlify Blobs

### Refresh automático
El sistema maneja automáticamente:
- Obtención de access tokens desde refresh token
- Renovación cuando expiran (3600 segundos)
- Cache en memoria para evitar requests repetidos
- Fallback a reautenticación si refresh token expira

---

## Flujo de Autenticación

### Primera vez (desarrollo)
```bash
1. Configurar TWITCH_CLIENT_ID y TWITCH_CLIENT_SECRET en .env
2. Visitar http://localhost:4321/api/twitch/login
3. Autorizar aplicación en Twitch
4. Copiar refresh_token de la página de callback
5. Añadir TWITCH_REFRESH_TOKEN a .env
6. Verificar funcionamiento con /api/twitch/status
```

### Primera vez (producción)
```bash
1. Configurar variables en Netlify (CLIENT_ID, CLIENT_SECRET)
2. Visitar https://tudominio.com/api/twitch/login
3. Autorizar aplicación
5. Verificar con /api/twitch/status
```

### Uso normal
Una vez configurado, simplemente llama a `/api/twitch/subscribers` y el sistema maneja todo automáticamente.

---

## Códigos de Error

| Código | Descripción | Causa común | Solución |
|--------|-------------|-------------|----------|
| 400 | Bad Request | Falta código OAuth | Rehacer flujo de autenticación |
| 401 | Unauthorized | Token inválido/expirado | Verificar refresh token |
| 403 | Forbidden | Permisos insuficientes | Reautorizar con scopes correctos |
| 500 | Internal Error | Error de refresh token | Reautenticar desde `/login` |
| 502 | Bad Gateway | Error de Twitch API | Verificar status de Twitch |

---

## Troubleshooting

### ❌ "No refresh token available"
```bash
# Verificar .env
cat .env | grep TWITCH_REFRESH_TOKEN

# Si está vacío, reautenticar
open http://localhost:4321/api/twitch/login
```

### ❌ "Invalid access token" 
```bash
# El refresh token puede haber expirado (>60 días sin uso)
# Solución: reautenticación completa
```

### ❌ "Faltan permisos"
```bash
# Verificar que se autorizó 'channel:read:subscriptions'
# Solución: reautenticar y aceptar todos los permisos
```

### ❌ Cache no funciona
```bash
# En desarrollo, el cache se pierde al reiniciar el servidor
# En producción, el cache se mantiene entre requests
```

### ⚠️ Rate limits de Twitch
```bash
# Twitch permite ~120 requests/minuto
# El cache evita este problema automáticamente
# Usar ?force=true solo cuando sea necesario
```

---

## Monitoreo y Debug

### Endpoints útiles para debug
- `/api/twitch/status` - Estado general del sistema
- `/api/twitch/cache-status` - Estado específico del cache
- `/api/twitch/subscribers` - Datos reales con info de cache

### Logs importantes
```javascript
// En subscribers.ts, buscar estos logs:
console.error('Error refreshing token:', { status: res.status, body: txt });
```

### Headers de respuesta útiles
```http
Cache-Control: public, max-age=60
Content-Type: application/json
```

### Información de debug en respuestas
```json
{
  "_cache_info": {
    "from_cache": true,
    "cached_at": "2025-05-27T10:25:00.000Z",
    "remaining_time_ms": 180000,
    "stale": false
  }
}
```
