import { posix as pathPosix } from 'path'

import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

import apiConfig from '../../config/api.config'
import siteConfig from '../../config/site.config'
import { revealObfuscatedToken } from './oAuthServer'
import { compareHashedToken } from './protectedRouteHandler'
import { getOdAuthTokens, storeOdAuthTokens } from './odAuthTokenStore'

const basePath = pathPosix.resolve('/', siteConfig.baseDirectory)
const clientId = apiConfig.clientId
const clientSecret = revealObfuscatedToken(apiConfig.obfuscatedClientSecret)

export interface AuthCheckResult {
  code: 200 | 401 | 404 | 500
  message: string
}

/**
 * Normalise a user supplied path into an absolute path inside the shared
 * OneDrive root. The leading slash is preserved for Graph, while the root
 * itself is represented by an empty string (Graph's `/root` endpoint).
 */
export function normalizePath(path: string): string {
  return pathPosix.resolve('/', pathPosix.normalize(path)).replace(/\/$/, '')
}

/**
 * Encode the path of the file relative to the base directory.
 *
 * @param path Relative path of the file to the base directory
 * @returns Absolute path of the file inside OneDrive
 */
export function encodePath(path: string): string {
  let encodedPath = pathPosix.join(basePath, path)
  if (encodedPath === '/' || encodedPath === '') {
    return ''
  }
  encodedPath = encodedPath.replace(/\/$/, '')
  return `:${encodeURIComponent(encodedPath)}`
}

/**
 * Fetch the access token from Redis storage and check if the token requires a renew.
 * Errors are converted to an empty token so API routes can answer with a stable
 * 403 and the client can restart the OAuth flow instead of receiving a generic 500.
 */
export async function getAccessToken(): Promise<string> {
  try {
    const { accessToken, refreshToken } = await getOdAuthTokens()

    if (typeof accessToken === 'string' && accessToken.trim().length > 0) {
      return accessToken.trim()
    }

    if (typeof refreshToken !== 'string' || refreshToken.trim().length === 0) {
      return ''
    }

    const body = new URLSearchParams()
    body.append('client_id', clientId)
    body.append('redirect_uri', apiConfig.redirectUri)
    body.append('client_secret', clientSecret)
    body.append('refresh_token', refreshToken)
    body.append('grant_type', 'refresh_token')

    const resp = await axios.post(apiConfig.authApi, body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })

    const data = resp.data as {
      access_token?: unknown
      refresh_token?: unknown
      expires_in?: unknown
    }
    const expiresIn = Number(data.expires_in)
    if (typeof data.access_token !== 'string' || !Number.isFinite(expiresIn) || expiresIn <= 0) {
      console.error('OneDrive token refresh returned an incomplete payload')
      return ''
    }

    // Microsoft normally rotates the refresh token. If it does not, keep the
    // existing one instead of losing the ability to refresh in the future.
    const nextRefreshToken = typeof data.refresh_token === 'string' ? data.refresh_token : refreshToken
    await storeOdAuthTokens({
      accessToken: data.access_token,
      accessTokenExpiry: Math.floor(expiresIn),
      refreshToken: nextRefreshToken,
    })
    return data.access_token
  } catch (error) {
    // Never log the Axios error object here: its config contains the client
    // secret and refresh token. Status + message are enough for diagnostics.
    const status = (error as { response?: { status?: number } })?.response?.status
    const message = error instanceof Error ? error.message : 'unknown error'
    console.error(`Failed to obtain a OneDrive access token (status=${status ?? 'n/a'}): ${message}`)
    return ''
  }
}

/**
 * Match protected routes in site config to get path to required auth token.
 *
 * @param path Path cleaned in advance
 * @returns Path to required auth token. If not required, return empty string.
 */
export function getAuthTokenPath(path: string): string {
  // Ensure trailing slashes to compare paths component by component. Same for protectedRoutes.
  // Since OneDrive ignores case, lower case before comparing. Same for protectedRoutes.
  const normalizedPath = path.toLowerCase() + '/'
  const protectedRoutes = siteConfig.protectedRoutes as string[]
  for (let route of protectedRoutes) {
    if (typeof route !== 'string') continue
    route = route.toLowerCase().replace(/\/+$/, '') + '/'
    if (normalizedPath.startsWith(route)) {
      return `${route}.password`
    }
  }
  return ''
}

/**
 * Handles protected route authentication:
 * - Match the cleanPath against an array of user defined protected routes
 * - If a match is found, download the `.password` file and compare its hash
 *   with the client supplied SHA-256 token.
 */
export async function checkAuthRoute(
  cleanPath: string,
  accessToken: string,
  odTokenHeader: string,
): Promise<AuthCheckResult> {
  const authTokenPath = getAuthTokenPath(cleanPath)

  if (authTokenPath === '') {
    return { code: 200, message: '' }
  }

  try {
    const token = await axios.get(`${apiConfig.driveApi}/root${encodePath(authTokenPath)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        select: '@microsoft.graph.downloadUrl,file',
      },
    })

    const downloadUrl = token.data?.['@microsoft.graph.downloadUrl']
    if (typeof downloadUrl !== 'string' || downloadUrl.length === 0) {
      return { code: 500, message: 'Password file has no download URL.' }
    }

    const odProtectedToken = await axios.get(downloadUrl, { responseType: 'text' })
    const dotPassword = typeof odProtectedToken.data === 'string' ? odProtectedToken.data : ''

    // An empty .password file must not make the folder accessible with
    // SHA-256("") — that is almost certainly a configuration mistake.
    if (dotPassword.trim().length === 0) {
      return { code: 500, message: 'The .password file is empty.' }
    }

    if (!compareHashedToken({ odTokenHeader, dotPassword })) {
      return { code: 401, message: 'Password required.' }
    }
  } catch (error) {
    const err = error as { response?: { status?: number } }
    if (err.response?.status === 404) {
      return { code: 404, message: "You didn't set a password." }
    }
    return { code: 500, message: 'Internal server error.' }
  }

  return { code: 200, message: 'Authenticated.' }
}

/** Read a query value that Next may expose as string | string[]. */
export function queryString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

/** Next query values are strings; support the common truthy spellings. */
export function queryFlag(value: unknown): boolean {
  const normalised = queryString(value).trim().toLowerCase()
  return normalised === '1' || normalised === 'true' || normalised === 'yes'
}

/** Read the protected-route token from the header first, then the query string. */
export function getProtectedToken(req: NextApiRequest, queryToken?: unknown): string {
  const header = req.headers['od-protected-token']
  if (typeof header === 'string' && header.length > 0) return header
  if (Array.isArray(header) && typeof header[0] === 'string') return header[0]
  return queryString(queryToken)
}

/** Responses containing private folder metadata or bytes must never be cached. */
export function setNoStore(res: NextApiResponse): void {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0')
  res.setHeader('CDN-Cache-Control', 'no-store')
  res.setHeader('Pragma', 'no-cache')
}

/** Public listings may be cached briefly at the edge, as before. */
export function setPublicCache(res: NextApiResponse): void {
  res.removeHeader('CDN-Cache-Control')
  res.removeHeader('Pragma')
  res.setHeader('Cache-Control', apiConfig.cacheControlHeader)
}

/** Raw files are fetched cross-origin by browser viewers and third-party tools. */
export function setCorsHeaders(res: NextApiResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')
  res.setHeader('Access-Control-Max-Age', '600')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Range, If-None-Match, If-Modified-Since, X-Requested-With, od-protected-token',
  )
  res.setHeader(
    'Access-Control-Expose-Headers',
    'Accept-Ranges, Content-Disposition, Content-Length, Content-Range, Content-Type, ETag, Last-Modified',
  )
}
