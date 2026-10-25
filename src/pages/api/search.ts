import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

import apiConfig from '../../../config/api.config'
import siteConfig from '../../../config/site.config'
import { isProtectedGraphItem } from '../../utils/protectedRouteHandler'
import { encodePath, getAccessToken, queryString, setNoStore, setPublicCache } from '../../utils/onedriveApi'
import type { OdSearchResult } from '../../types'

const MAX_QUERY_LENGTH = 256

function graphOrigin(): string {
  try {
    return new URL(apiConfig.driveApi).origin
  } catch {
    return 'https://graph.microsoft.com'
  }
}

/**
 * Sanitize the search query.
 *
 * Graph's search syntax uses an OData string literal in the path. Escape single
 * quotes, remove characters that are not valid in this context, then encode the
 * result as one URL path segment.
 */
function sanitiseQuery(query: string): string {
  return encodeURIComponent(
    query
      .replace(/'/g, "''")
      .replace(/</g, ' &lt; ')
      .replace(/>/g, ' &gt; ')
      .replace(/\?/g, ' ')
      .replace(/\//g, ' ')
      .replace(/\\/g, ' '),
  )
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    res.status(405).end()
    return
  }

  setNoStore(res)

  const searchQuery = queryString(req.query.q).trim()
  if (searchQuery.length > MAX_QUERY_LENGTH) {
    res.status(400).json({ error: 'Search query is too long.' })
    return
  }
  if (searchQuery.length === 0) {
    setPublicCache(res)
    res.status(200).json([])
    return
  }

  const accessToken = await getAccessToken()
  if (!accessToken) {
    res.status(403).json({ error: 'No access token.' })
    return
  }

  const searchRootPath = encodePath('/')
  const encodedPath = searchRootPath === '' ? searchRootPath : `${searchRootPath}:`
  // Follow the configured cloud endpoint (international / 21Vianet) instead of
  // hardcoding graph.microsoft.com.
  const searchApi = `${graphOrigin()}/beta/me/drive/root${encodedPath}/search(q='${sanitiseQuery(searchQuery)}')`

  try {
    const { data } = await axios.get(searchApi, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        select: 'id,name,file,folder,parentReference',
        $top: Math.max(1, Math.min(200, Number(siteConfig.maxItems) || 100)),
      },
    })

    const items = Array.isArray(data?.value) ? (data.value as OdSearchResult) : []
    // Search results must never expose items under protected routes. Check the
    // item itself as well as its parent so the protected folder's own result is
    // not returned.
    const filtered = items.filter(item => {
      const parentPath = item?.parentReference?.path
      if (typeof parentPath !== 'string' || parentPath.length === 0) return false
      return !isProtectedGraphItem(parentPath, item.name)
    })

    setPublicCache(res)
    res.status(200).json(filtered)
  } catch (error) {
    setNoStore(res)
    const status = (error as { response?: { status?: number } })?.response?.status
    const safeStatus = typeof status === 'number' && status >= 400 && status < 500 ? status : 500
    res.status(safeStatus).json({ error: 'Search failed.' })
  }
}
