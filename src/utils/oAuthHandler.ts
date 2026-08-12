import axios from 'axios'
import CryptoJS from 'crypto-js'

import apiConfig from '../../config/api.config'

async function getConfig() {
  const res = await axios.get('/api/config')
  return res.data
}

// Just a disguise to obfuscate required tokens (including but not limited to client secret,
// access tokens, and refresh tokens), used along with the following two functions
const AES_SECRET_KEY = 'onedrive-vercel-index'
export function revealObfuscatedToken(obfuscated: string): string {
  // Decrypt SHA256 obfuscated token
  const decrypted = CryptoJS.AES.decrypt(obfuscated, AES_SECRET_KEY)
  return decrypted.toString(CryptoJS.enc.Utf8)
}

// Generate the Microsoft OAuth 2.0 authorization URL, used for requesting the authorisation code
export async function generateAuthorisationUrl(): Promise<string> {
  const { clientId } = await getConfig() 
  const { redirectUri, authApi, scope } = apiConfig
  const authUrl = authApi.replace('/token', '/authorize')

  // Construct URL parameters for OAuth2
  const params = new URLSearchParams()
  params.append('client_id', clientId)
  params.append('redirect_uri', redirectUri)
  params.append('response_type', 'code')
  params.append('scope', scope)
  params.append('response_mode', 'query')

  return `${authUrl}?${params.toString()}`
}

// The code returned from the Microsoft OAuth 2.0 authorization URL is a request URL with hostname
// http://localhost and URL parameter code. This function extracts the code from the request URL
export function extractAuthCodeFromRedirected(url: string): string {
  // Return empty string if the url is not the defined redirect uri
  if (!url.startsWith(apiConfig.redirectUri)) {
    return ''
  }

  // New URL search parameter
  const params = new URLSearchParams(url.split('?')[1])
  return params.get('code') ?? ''
}

interface AuthConfig {
  clientId: string
  clientSecret: string
}

// After a successful authorisation, the code returned from the Microsoft OAuth 2.0 authorization URL
// will be used to request an access token. This function requests the access token with the authorisation code
// and returns the access token and refresh token on success.
export async function requestTokenWithAuthCode(code: string, config: AuthConfig): Promise<
  | { expiryTime: string; accessToken: string; refreshToken: string; idToken?: string }
  | { error: string; errorDescription: string; errorUri: string }
> {
  try {
    const clientId = config.clientId
    const clientSecret = revealObfuscatedToken(config.clientSecret)
    const { redirectUri, authApi } = apiConfig

    // Construct URL parameters for OAuth2
    const params = new URLSearchParams()
    params.append('client_id', clientId)
    params.append('redirect_uri', redirectUri)
    params.append('client_secret', clientSecret)
    params.append('code', code)
    params.append('grant_type', 'authorization_code')

    // Request access token
    return axios
      .post(authApi, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })
      .then(resp => {
        const { expires_in, access_token, refresh_token, id_token } = resp.data
        return { expiryTime: expires_in, accessToken: access_token, refreshToken: refresh_token, idToken: id_token }
      })
      .catch(err => {
        const { error, error_description, error_uri } = err.response.data
        return { error, errorDescription: error_description, errorUri: error_uri }
      })
  } catch (error) {
    console.error("Failed to get config:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return { error: "Failed to get config", errorDescription: errorMessage, errorUri: "" }
  }
}

// Verify the identity of the user with the access token and compare it with the userPrincipalName
// set in the config. Identity claims (preferred_username / upn / emails) are read from the
// Microsoft-signed JWT tokens (id_token first, access token as fallback): they are emitted by
// Microsoft itself and cannot be forged. Note access tokens only carry them when the app enables
// optional claims, which is why the id_token (containing them by default when openid is requested)
// is preferred.
function decodeTokenClaims(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Record<string, unknown>
  } catch {
    return null
  }
}

export function getUserPrincipalNameFromToken(...tokens: Array<string | undefined>): string | null {
  for (const token of tokens) {
    if (!token) continue
    const claims = decodeTokenClaims(token)
    if (!claims) continue
    let identity: string | null = null
    if (typeof claims.upn === 'string') identity = claims.upn
    else if (typeof claims.preferred_username === 'string') identity = claims.preferred_username
    else if (typeof claims.email === 'string') identity = claims.email
    else if (Array.isArray(claims.emails)) {
      const firstEmail = claims.emails.find((e: unknown) => typeof e === 'string')
      if (typeof firstEmail === 'string') identity = firstEmail
    }
    if (identity) return identity
  }
  return null
}
