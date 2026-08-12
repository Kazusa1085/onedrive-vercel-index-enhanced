import sha256 from 'crypto-js/sha256'
import siteConfig from '../../config/site.config'

// Hash password token with SHA256
function encryptToken(token: string): string {
  return sha256(token).toString()
}

// Fetch stored token from localStorage and encrypt with SHA256
export function getStoredToken(path: string): string | null {
  if (typeof window === 'undefined') {
    return null
  }
  try {
    const storedToken = JSON.parse(localStorage.getItem(matchProtectedRoute(path)) as string)
    return storedToken ? encryptToken(storedToken) : null
  } catch {
    return null
  }
}

/**
 * Compares the hash of .password and od-protected-token header
 * @param odTokenHeader od-protected-token header (sha256 hashed token)
 * @param dotPassword non-hashed .password file
 * @returns whether the two hashes are the same
 */
export function compareHashedToken({
  odTokenHeader,
  dotPassword,
}: {
  odTokenHeader: string
  dotPassword: string
}): boolean {
  return encryptToken(dotPassword.trim()) === odTokenHeader
}
/**
 * Match the specified route against a list of predefined routes
 * @param route directory path
 * @returns whether the directory is protected
 */

export function matchProtectedRoute(route: string): string {
  const protectedRoutes: string[] = siteConfig.protectedRoutes
  const normalizedRoute = (() => {
    try {
      return decodeURIComponent(route).replace(/\/+$/, '').toLowerCase()
    } catch {
      return route.replace(/\/+$/, '').toLowerCase()
    }
  })()

  for (const r of protectedRoutes) {
    // protected route array could be empty
    if (r) {
      const normalizedProtectedRoute = r.replace(/\/+$/, '').toLowerCase()
      if (normalizedRoute === normalizedProtectedRoute || normalizedRoute.startsWith(normalizedProtectedRoute + '/')) return r
    }
  }
  return ''
}

/**
 * Check whether a Microsoft Graph drive item path (as returned by
 * `parentReference.path`) points into any protected route.
 * Graph paths look like '/drive/root:/Private/sub' (international) or
 * '/drives/b!id/root:/"Private"/"sub"' (business), usually URL-encoded.
 */
export function isProtectedGraphPath(drivePath: string): boolean {
  try {
    const decoded = decodeURIComponent(drivePath)
    const rootIndex = decoded.indexOf('root:')
    const sitePath = ('/' + (rootIndex !== -1 ? decoded.slice(rootIndex + 5) : decoded).replace(/"/g, '')).toLowerCase()

    for (const route of siteConfig.protectedRoutes) {
      const normalized = '/' + route.replace(/^\/+|\/+$/g, '').toLowerCase()
      if (sitePath === normalized || sitePath.startsWith(normalized + '/')) {
        return true
      }
    }
  } catch {
    // path decoding or comparison failed; treat as unprotected
  }
  return false
}
