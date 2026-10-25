import type { NextApiRequest, NextApiResponse } from 'next'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../config/site.config', () => ({
  default: {
    baseDirectory: '/',
    protectedRoutes: ['/Private Folder'],
    maxItems: 100,
  },
}))

import {
  encodePath,
  getAuthTokenPath,
  getProtectedToken,
  normalizePath,
  queryFlag,
  queryString,
  setNoStore,
  setPublicCache,
} from './onedriveApi'
import {
  compareHashedToken,
  getStoredToken,
  hashToken,
  isProtectedGraphItem,
  isProtectedGraphPath,
} from './protectedRouteHandler'

const protectedRoute = '/Private Folder'

function createResponse() {
  const headers = new Map<string, string>()
  const res = {
    setHeader: (name: string, value: unknown) => headers.set(name.toLowerCase(), String(value)),
    removeHeader: (name: string) => headers.delete(name.toLowerCase()),
    getHeader: (name: string) => headers.get(name.toLowerCase()),
  } as unknown as NextApiResponse
  return { headers, res }
}

function createStorage(): Storage {
  const values = new Map<string, string>()
  return {
    get length() {
      return values.size
    },
    clear: () => values.clear(),
    getItem: (key: string) => values.get(key) ?? null,
    key: (index: number) => Array.from(values.keys())[index] ?? null,
    removeItem: (key: string) => values.delete(key),
    setItem: (key: string, value: string) => {
      values.set(key, value)
    },
  }
}

describe('normalizePath', () => {
  it('normalizes dot segments and strips the trailing slash', () => {
    expect(normalizePath('/a/../b/')).toBe('/b')
    expect(normalizePath('/')).toBe('')
  })

  it('does not allow escaping the drive root with ..', () => {
    expect(normalizePath('/../secret')).toBe('/secret')
  })
})

describe('encodePath', () => {
  it('encodes the root as an empty Graph suffix', () => {
    expect(encodePath('/')).toBe('')
  })

  it('encodes slashes and spaces as one Graph path segment', () => {
    expect(encodePath('/folder/file name.pdf')).toBe(':%2Ffolder%2Ffile%20name.pdf')
  })
})

describe('query parsing', () => {
  it('accepts the common boolean spellings only', () => {
    expect(queryFlag('true')).toBe(true)
    expect(queryFlag('1')).toBe(true)
    expect(queryFlag('yes')).toBe(true)
    expect(queryFlag('false')).toBe(false)
    expect(queryFlag(undefined)).toBe(false)
  })

  it('normalises array query values safely', () => {
    expect(queryString('/a')).toBe('/a')
    expect(queryString(['/a', '/b'])).toBe('')
    expect(queryString(undefined, '/')).toBe('/')
  })

  it('prefers the protected-token header and falls back to the query', () => {
    const req = { headers: { 'od-protected-token': 'header-token' } } as unknown as NextApiRequest
    expect(getProtectedToken(req, 'query-token')).toBe('header-token')
    expect(getProtectedToken({ headers: {} } as unknown as NextApiRequest, 'query-token')).toBe('query-token')
    expect(getProtectedToken({ headers: { 'od-protected-token': ['first'] } } as unknown as NextApiRequest)).toBe(
      'first',
    )
  })
})

describe('cache headers', () => {
  it('marks private responses as non-cacheable', () => {
    const { headers, res } = createResponse()
    setNoStore(res)
    expect(headers.get('cache-control')).toContain('no-store')
    expect(headers.get('cdn-cache-control')).toBe('no-store')
    expect(headers.get('pragma')).toBe('no-cache')
  })

  it('restores the public edge policy for successful unprotected responses', () => {
    const { headers, res } = createResponse()
    setNoStore(res)
    setPublicCache(res)
    expect(headers.get('cache-control')).toBe('max-age=0, s-maxage=60, stale-while-revalidate')
    expect(headers.has('cdn-cache-control')).toBe(false)
    expect(headers.has('pragma')).toBe(false)
  })
})

describe('protected route matching', () => {
  it('matches children of a protected route and returns the password path', () => {
    const route = protectedRoute.toLowerCase()
    expect(getAuthTokenPath(`${protectedRoute}/sub/file.pdf`)).toBe(`${route}/.password`)
  })

  it('does not match a sibling with a shared prefix', () => {
    expect(getAuthTokenPath(`${protectedRoute}-public/file.pdf`)).toBe('')
  })

  it('matches Graph parent paths and the protected folder item itself', () => {
    const segments = protectedRoute.split('/').filter(Boolean)
    const encodedParent = segments
      .slice(0, -1)
      .map(segment => encodeURIComponent(segment))
      .join('/')
    const parentPath = encodedParent ? `/drive/root:/${encodedParent}` : '/drive/root:'

    expect(isProtectedGraphPath(`/drive/root:${segments.map(encodeURIComponent).join('/')}/file.pdf`)).toBe(true)
    expect(isProtectedGraphItem(parentPath, segments[segments.length - 1])).toBe(true)
  })

  it('does not mark an unrelated Graph path as protected', () => {
    expect(isProtectedGraphPath('/drive/root:/Public/file.pdf')).toBe(false)
  })
})

describe('password tokens', () => {
  beforeEach(() => {
    vi.stubGlobal('window', { localStorage: createStorage() })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('compares trimmed passwords in constant time', () => {
    expect(compareHashedToken({ odTokenHeader: hashToken('secret'), dotPassword: ' secret \n' })).toBe(true)
    expect(compareHashedToken({ odTokenHeader: hashToken('secret'), dotPassword: 'wrong' })).toBe(false)
    expect(compareHashedToken({ odTokenHeader: 'not-a-hash', dotPassword: 'secret' })).toBe(false)
  })

  it('migrates a legacy plaintext token to a hash on read', () => {
    window.localStorage.setItem(protectedRoute, JSON.stringify('secret'))

    expect(getStoredToken(protectedRoute)).toBe(hashToken('secret'))
    expect(JSON.parse(window.localStorage.getItem(protectedRoute) as string)).toEqual({
      v: 2,
      hash: hashToken('secret'),
    })
  })

  it('reads the versioned hashed format without re-hashing', () => {
    const hash = hashToken('secret')
    window.localStorage.setItem(protectedRoute, JSON.stringify({ v: 2, hash }))

    expect(getStoredToken(protectedRoute)).toBe(hash)
  })

  it('returns null outside the browser or without a stored token', () => {
    expect(getStoredToken('/Public/file.pdf')).toBeNull()
    vi.unstubAllGlobals()
    expect(getStoredToken(protectedRoute)).toBeNull()
  })
})
