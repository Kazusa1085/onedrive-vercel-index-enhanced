import Redis from 'ioredis'
import siteConfig from '../../config/site.config'

// Persistent key-value store is provided by Redis, hosted on Upstash
// https://vercel.com/integrations/upstash
//
// The client is created lazily on the first command. This keeps `next build`
// and cold module evaluation free of network side effects and gives a clear
// error when REDIS_URL is missing instead of silently connecting to localhost.
let kv: Redis | null = null

function getKv(): Redis {
  const redisUrl = process.env.REDIS_URL?.trim()
  if (!redisUrl) {
    throw new Error('REDIS_URL is not configured')
  }
  if (!kv) {
    kv = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      connectTimeout: 8_000,
      enableOfflineQueue: true,
      retryStrategy: times => (times > 2 ? null : 250),
    })
  }
  return kv
}

export async function getOdAuthTokens(): Promise<{
  accessToken: string | null
  refreshToken: string | null
}> {
  const client = getKv()
  const [accessToken, refreshToken] = await Promise.all([
    client.get(`${siteConfig.kvPrefix}access_token`),
    client.get(`${siteConfig.kvPrefix}refresh_token`),
  ])

  return { accessToken, refreshToken }
}

export async function storeOdAuthTokens({
  accessToken,
  accessTokenExpiry,
  refreshToken,
}: {
  accessToken: string
  accessTokenExpiry: number
  refreshToken: string
}): Promise<void> {
  const expiry = Math.floor(accessTokenExpiry)
  if (!Number.isFinite(expiry) || expiry <= 0) {
    throw new Error('Invalid access token expiry')
  }

  const client = getKv()
  const result = await client
    .multi()
    .set(`${siteConfig.kvPrefix}access_token`, accessToken, 'EX', expiry)
    .set(`${siteConfig.kvPrefix}refresh_token`, refreshToken)
    .exec()

  // ioredis resolves with null when the transaction was aborted, and embeds
  // per-command errors in the result array when a command fails.
  if (!result || result.some(([error]) => error)) {
    throw new Error('Failed to store OneDrive tokens')
  }
}
