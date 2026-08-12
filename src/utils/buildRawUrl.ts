import { getBaseUrl } from './getBaseUrl'
import { getStoredToken } from './protectedRouteHandler'

/**
 * Build a raw file URL for the given (already percent-encoded) path,
 * appending the protected-route token if the path requires one.
 * @param path Encoded path, e.g. `/sub%20dir/file.mp4`
 * @param proxy Route the content through the server proxy (keeps CORS/content-type)
 */
export const buildRawUrl = (path: string, { proxy = false }: { proxy?: boolean } = {}): string => {
  const hashedToken = getStoredToken(path)
  return `${getBaseUrl()}/api/raw/?path=${path}${proxy ? '&proxy=true' : ''}${hashedToken ? `&odpt=${hashedToken}` : ''}`
}