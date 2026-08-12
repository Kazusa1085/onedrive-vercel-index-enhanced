import axios from 'axios'
import CryptoJS from 'crypto-js'

import apiConfig from '../../config/api.config'

const AES_SECRET_KEY = 'onedrive-vercel-index'

export function revealObfuscatedToken(obfuscated: string): string {
  return CryptoJS.AES.decrypt(obfuscated, AES_SECRET_KEY).toString(CryptoJS.enc.Utf8)
}

export function generateAuthorisationUrl(): string {
  const params = new URLSearchParams()
  params.append('client_id', apiConfig.clientId)
  params.append('redirect_uri', apiConfig.redirectUri)
  params.append('response_type', 'code')
  params.append('scope', apiConfig.scope)
  params.append('response_mode', 'query')
  return `${apiConfig.authApi.replace('/token', '/authorize')}?${params.toString()}`
}

export async function requestTokenWithAuthCode(code: string): Promise<
  | { expiryTime: string; accessToken: string; refreshToken: string }
  | { error: string; errorDescription: string; errorUri: string }
> {
  try {
    const params = new URLSearchParams()
    params.append('client_id', apiConfig.clientId)
    params.append('redirect_uri', apiConfig.redirectUri)
    params.append('client_secret', revealObfuscatedToken(apiConfig.obfuscatedClientSecret))
    params.append('code', code)
    params.append('grant_type', 'authorization_code')

    const { data } = await axios.post(apiConfig.authApi, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    const { expires_in, access_token, refresh_token } = data
    if (typeof expires_in !== 'string' && typeof expires_in !== 'number') throw new Error('OAuth response is missing expiry')
    if (typeof access_token !== 'string' || typeof refresh_token !== 'string') throw new Error('OAuth response is missing tokens')
    return { expiryTime: String(expires_in), accessToken: access_token, refreshToken: refresh_token }
  } catch (error) {
    const err = error as { response?: { data?: { error?: unknown; error_description?: unknown; error_uri?: unknown } }; message?: string }
    const details = err.response?.data
    return {
      error: typeof details?.error === 'string' ? details.error : 'OAuth token request failed',
      errorDescription: typeof details?.error_description === 'string' ? details.error_description : err.message ?? 'Unknown error',
      errorUri: typeof details?.error_uri === 'string' ? details.error_uri : '',
    }
  }
}

// Validate the real owner through Microsoft Graph rather than trusting JWT
// payload text supplied by the authorization server or a browser.
export async function accessTokenBelongsToOwner(accessToken: string, expectedUserPrincipalName: string): Promise<boolean> {
  try {
    const userApi = apiConfig.driveApi.replace(/\/drive$/, '')
    const { data } = await axios.get(userApi, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { select: 'userPrincipalName,mail,otherMails' },
    })
    const identities = [data.userPrincipalName, data.mail, ...(Array.isArray(data.otherMails) ? data.otherMails : [])]
    return identities.some(identity => typeof identity === 'string' && identity.toLowerCase() === expectedUserPrincipalName.toLowerCase())
  } catch {
    return false
  }
}
