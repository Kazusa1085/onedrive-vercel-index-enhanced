import { describe, expect, it } from 'vitest'

import { extractAuthCodeFromRedirected } from './oAuthClient'

describe('extractAuthCodeFromRedirected', () => {
  it('extracts a code from the configured localhost redirect', () => {
    expect(extractAuthCodeFromRedirected('http://localhost/?code=M.R3_BAY.abc-123', 'http://localhost')).toBe(
      'M.R3_BAY.abc-123',
    )
  })

  it('rejects lookalike origins', () => {
    expect(extractAuthCodeFromRedirected('http://localhost.evil.example/?code=stolen', 'http://localhost')).toBe('')
  })

  it('rejects a mismatched callback path', () => {
    expect(extractAuthCodeFromRedirected('http://localhost/other?code=abc', 'http://localhost/callback')).toBe('')
    expect(extractAuthCodeFromRedirected('http://localhost/callback?code=abc', 'http://localhost/callback')).toBe('abc')
  })

  it('returns an empty string for malformed URLs and missing codes', () => {
    expect(extractAuthCodeFromRedirected('not a url', 'http://localhost')).toBe('')
    expect(extractAuthCodeFromRedirected('http://localhost/', 'http://localhost')).toBe('')
  })
})
