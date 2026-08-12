/**
 * This file contains the configuration for the API endpoints and tokens we use.
 *
 * - If you are a OneDrive International user, you would not have to change anything here.
 * - If you are not the admin of your OneDrive for Business account, you may need to define your own clientId/clientSecret,
 *   check documentation for more details.
 * - If you are using a E5 Subscription OneDrive for Business account, the direct links of your files are not the same here.
 *   In which case you would need to change directLinkRegex.
 */
module.exports = {
  // The clientId and clientSecret are used to authenticate the user with Microsoft Graph API using OAuth. You would
  // not need to change anything here if you can authenticate with your personal Microsoft account with OneDrive International.
  // The public fallbacks below are the shared app registration that ships with OneManager-php (updated 2026, still
  // functional). Set CLIENT_ID / SECRET_KEY (obfuscated) in your Vercel project's Environment Variables to override
  // them with your own app registration.
  clientId: process.env.CLIENT_ID || '734ef928-d74c-4555-8d1b-d942fa0a1a41',
  obfuscatedClientSecret: process.env.SECRET_KEY || 'U2FsdGVkX18MgnpA5lg/gk71yBduC9TjXjx7WnEfGQQ/iBPEYcRJ/XCcBoU7aXB0pwBYBDSLipbIABXrpAi+ew==',

  // The redirectUri is the URL that the user will be redirected to after they have authenticated with Microsoft Graph API.
  // Likewise, you would not need to change redirectUri if you are using your personal Microsoft account with OneDrive International.
  redirectUri: 'http://localhost',

  // These are the URLs of the OneDrive API endpoints. You would not need to change anything here if you are using OneDrive International
  // or E5 Subscription OneDrive for Business. You may need to change these if you are using OneDrive 世纪互联.
  authApi: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
  driveApi: 'https://graph.microsoft.com/v1.0/me/drive',

  // The scope we require are listed here, in most cases you would not need to change this as well.
  // These scopes must match the permissions registered on the app (File.ReadWrite.All covers reading).
  // openid/profile/email are reserved id_token scopes: they make Microsoft emit the identity claims
  // (preferred_username / emails) used for the server-side owner check.
  scope: 'openid profile email https://graph.microsoft.com/Files.ReadWrite.All offline_access',

  // Cache-Control header, check Vercel documentation for more details. The default settings imply:
  // - max-age=0: no cache for your browser
  // - s-maxage=0: cache is fresh for 60 seconds on the edge, after which it becomes stale
  // - stale-while-revalidate: allow serving stale content while revalidating on the edge
  // https://vercel.com/docs/concepts/edge-network/caching
  cacheControlHeader: 'max-age=0, s-maxage=60, stale-while-revalidate',
}
