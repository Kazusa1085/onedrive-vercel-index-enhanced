// The redirect lands on localhost by design; extract the authorization code
// locally without exposing any OAuth secret to the browser.
export function extractAuthCodeFromRedirected(url: string, redirectUri: string): string {
  try {
    const expected = new URL(redirectUri)
    const actual = new URL(url)

    // Do not use a raw string prefix check: `http://localhost.evil.example`
    // starts with `http://localhost` but is a different origin.
    if (actual.origin !== expected.origin) return ''
    if (expected.pathname !== '/' && actual.pathname !== expected.pathname) return ''

    return actual.searchParams.get('code') ?? ''
  } catch {
    return ''
  }
}
