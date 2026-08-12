import axios from 'axios'
import type { NextApiRequest, NextApiResponse } from 'next'

import { encodePath, getAccessToken } from '.'
import apiConfig from '../../../config/api.config'
import siteConfig from '../../../config/site.config'
import { isProtectedGraphPath } from '../../utils/protectedRouteHandler'
import type { OdSearchResult } from '../../types'

/**
 * Sanitize the search query
 *
 * @param query User search query, which may contain special characters
 * @returns Sanitised query string, which:
 * - encodes the '<' and '>' characters,
 * - replaces '?' and '/' characters with ' ',
 * - replaces ''' with ''''
 * Reference: https://stackoverflow.com/questions/41491222/single-quote-escaping-in-microsoft-graph.
 */
function sanitiseQuery(query: string): string {
  const sanitisedQuery = query
    .replace(/'/g, "''")
    .replace(/</g, ' &lt; ')
    .replace(/>/g, ' &gt; ')
    .replace(/\?/g, ' ')
    .replace(/\//g, ' ')
    .replace(/\\/g, ' ')
  return encodeURIComponent(sanitisedQuery)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Get access token from storage
  const accessToken = await getAccessToken()

  // Query parameter from request
  const { q: searchQuery = '' } = req.query

  // Set edge function caching for faster load times, check docs:
  // https://vercel.com/docs/concepts/functions/edge-caching
  res.setHeader('Cache-Control', apiConfig.cacheControlHeader)

  // Return error 403 if access_token is empty
  if (!accessToken) {
    res.status(403).json({ error: 'No access token.' })
    return
  }

  if (typeof searchQuery === 'string') {
    // Construct Microsoft Graph Search API URL, and perform search only under the base directory.
    // Use the beta endpoint: the v1.0 search(q=) endpoint returns empty results on personal
    // OneDrive accounts (known gap), while beta drives the same search reliably.
    const searchRootPath = encodePath('/')
    const encodedPath = searchRootPath === '' ? searchRootPath : searchRootPath + ':'

    const searchApi = `https://graph.microsoft.com/beta/me/drive/root${encodedPath}/search(q='${sanitiseQuery(searchQuery)}')`

    try {
      const { data } = await axios.get(searchApi, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          select: 'id,name,file,folder,parentReference',
          top: siteConfig.maxItems,
        },
      })
      // Search results must never expose files under protected routes:
      // filter them out server-side before results reach the client.
      const filtered = (data.value as OdSearchResult).filter(item => !isProtectedGraphPath(item.parentReference?.path ?? ''))
      res.status(200).json(filtered)
    } catch (error) {
      const err = error as { response?: { status?: number; data?: unknown } }
      res.status(err.response?.status ?? 500).json({ error: err.response?.data ?? 'Internal server error.' })
    }
  } else {
    res.status(200).json([])
  }
  return
}
