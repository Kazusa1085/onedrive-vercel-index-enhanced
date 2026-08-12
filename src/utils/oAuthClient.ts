// The redirect lands on localhost by design; extract the authorization code
// locally without exposing any OAuth secret to the browser.
export function extractAuthCodeFromRedirected(url: string, redirectUri: string): string {
  if (!url.startsWith(redirectUri)) return ''
  return new URLSearchParams(url.split('?')[1]).get('code') ?? ''
}
