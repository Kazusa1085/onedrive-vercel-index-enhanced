import sha256 from 'crypto-js/sha256'
import siteConfig from '../../config/site.config'

const HASH_PATTERN = /^[a-f0-9]{64}$/i

/** Hash a password for storage and for the `od-protected-token` header. */
export function hashToken(token: string): string {
  return sha256(token).toString()
}

export interface StoredHashedToken {
  v: 2
  hash: string
}

/** Fetch a stored token hash, migrating legacy plaintext entries on read. */
export function getStoredToken(path: string): string | null {
  if (typeof window === 'undefined') {
    return null
  }
  try {
    const key = matchProtectedRoute(path)
    if (!key) return null
    const raw = window.localStorage.getItem(key)
    if (!raw) return null

    const stored: unknown = JSON.parse(raw)
    if (
      stored &&
      typeof stored === 'object' &&
      (stored as StoredHashedToken).v === 2 &&
      typeof (stored as StoredHashedToken).hash === 'string' &&
      HASH_PATTERN.test((stored as StoredHashedToken).hash)
    ) {
      return (stored as StoredHashedToken).hash.toLowerCase()
    }

    // Legacy versions stored the plaintext password. Upgrade it in memory and
    // in localStorage so a later request does not keep the plaintext around.
    if (typeof stored === 'string' && stored.length > 0) {
      const hash = hashToken(stored)
      const upgraded: StoredHashedToken = { v: 2, hash }
      window.localStorage.setItem(key, JSON.stringify(upgraded))
      return hash
    }

    return null
  } catch {
    return null
  }
}

/**
 * Compares the hash of .password and od-protected-token header.
 * The comparison is constant-time to avoid leaking hash bytes via timing.
 *
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
  const expected = hashToken(dotPassword.trim())
  const actual = odTokenHeader.trim().toLowerCase()
  if (expected.length !== actual.length) return false

  let difference = 0
  for (let i = 0; i < expected.length; i += 1) {
    difference |= expected.charCodeAt(i) ^ actual.charCodeAt(i)
  }
  return difference === 0
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
      if (normalizedRoute === normalizedProtectedRoute || normalizedRoute.startsWith(normalizedProtectedRoute + '/'))
        return r
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
    const suffix = (rootIndex !== -1 ? decoded.slice(rootIndex + 5) : decoded).replace(/"/g, '').replace(/^\/+/, '')
    const sitePath = `/${suffix}`.toLowerCase()

    for (const route of siteConfig.protectedRoutes) {
      const normalized = '/' + route.replace(/^\/+|\/+$/g, '').toLowerCase()
      if (sitePath === normalized || sitePath.startsWith(normalized + '/')) {
        return true
      }
    }
  } catch {
    // A path we cannot decode could hide a protected segment. Fail closed
    // instead of exposing the item.
    return true
  }
  return false
}

/**
 * Check both the parent folder and the item itself against protected routes.
 * Search results for a protected folder itself have a root parent, so checking
 * only `parentReference.path` would leak the folder's name and id.
 */
export function isProtectedGraphItem(parentPath: string, itemName: string): boolean {
  if (isProtectedGraphPath(parentPath)) return true
  const parent = parentPath.replace(/\/+$/, '')
  return isProtectedGraphPath(parent ? `${parent}/${itemName}` : itemName)
}
