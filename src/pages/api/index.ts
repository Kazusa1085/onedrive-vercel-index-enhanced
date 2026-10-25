import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

import apiConfig from '../../../config/api.config'
import siteConfig from '../../../config/site.config'
import {
  checkAuthRoute,
  encodePath,
  getAccessToken,
  getProtectedToken,
  normalizePath,
  queryFlag,
  queryString,
  setCorsHeaders,
  setNoStore,
  setPublicCache,
} from '../../utils/onedriveApi'

const MAX_PATH_LENGTH = 2048
const MAX_SKIP_TOKEN_LENGTH = 4096
const SORTABLE_FIELDS = new Set(['name', 'lastModifiedDateTime', 'size'])

/**
 * Only allow the Graph order-by fields the UI can safely expose. The sort
 * value is passed as a query parameter (never concatenated into the URL), but a
 * whitelist still prevents malformed OData from being forwarded to Graph.
 */
function normaliseSort(value: string): string {
  const [field, direction] = value.trim().split(/\s+/)
  if (!SORTABLE_FIELDS.has(field)) return ''
  if (!direction) return field
  return direction.toLowerCase() === 'desc' ? `${field} desc` : field
}

function graphErrorStatus(error: unknown): number {
  const status = (error as { response?: { status?: number } })?.response?.status
  // A Graph 401 means our stored token is no longer valid. The client treats
  // 403 as "restart OAuth", while 401 would incorrectly show the folder
  // password prompt.
  if (status === 401) return 403
  return typeof status === 'number' && status >= 400 ? status : 500
}

function graphErrorMessage(error: unknown): unknown {
  const data = (error as { response?: { data?: unknown } })?.response?.data
  return data ?? 'Internal server error.'
}

function extractSkipToken(nextLink: unknown): string | null {
  if (typeof nextLink !== 'string') return null
  try {
    const url = new URL(nextLink)
    return url.searchParams.get('$skiptoken') ?? url.searchParams.get('$skipToken')
  } catch {
    const match = nextLink.match(/[?&]\$skiptoken=(.+)/i)
    return match?.[1] ?? null
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    res.status(405).end()
    return
  }

  // Start from the safest possible cache policy. Only an unprotected,
  // successful listing is allowed to replace it with the public CDN policy.
  setNoStore(res)

  const rawPath = queryString(req.query.path, '/')
  if (rawPath === '[...path]') {
    res.status(400).json({ error: 'No path specified.' })
    return
  }
  if (rawPath.length > MAX_PATH_LENGTH) {
    res.status(414).json({ error: 'Path is too long.' })
    return
  }

  const cleanPath = normalizePath(rawPath)
  const sort = normaliseSort(queryString(req.query.sort))
  const next = queryString(req.query.next)
  if (next.length > MAX_SKIP_TOKEN_LENGTH) {
    res.status(400).json({ error: 'Pagination token is too long.' })
    return
  }

  const accessToken = await getAccessToken()
  if (!accessToken) {
    res.status(403).json({ error: 'No access token.' })
    return
  }

  const protectedToken = getProtectedToken(req, req.query.odpt)
  const { code, message } = await checkAuthRoute(cleanPath, accessToken, protectedToken)
  if (code !== 200) {
    res.status(code).json({ error: message })
    return
  }
  const isProtected = message !== ''

  const requestPath = encodePath(cleanPath)
  const requestUrl = `${apiConfig.driveApi}/root${requestPath}`
  const isRoot = requestPath === ''

  // Backwards-compatible raw file link. Redirects are intentionally not cached:
  // the CDN URL is short lived and can point at protected content.
  if (queryFlag(req.query.raw)) {
    setCorsHeaders(res)
    setNoStore(res)
    try {
      const { data } = await axios.get(requestUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          // OneDrive international fails when only selecting the downloadUrl.
          select: 'id,@microsoft.graph.downloadUrl',
        },
      })
      const downloadUrl = data?.['@microsoft.graph.downloadUrl']
      if (typeof downloadUrl === 'string' && downloadUrl.length > 0) {
        res.redirect(302, downloadUrl)
      } else {
        res.status(404).json({ error: 'No download url found.' })
      }
    } catch (error) {
      setNoStore(res)
      res.status(graphErrorStatus(error)).json({ error: graphErrorMessage(error) })
    }
    return
  }

  try {
    const { data: identityData } = await axios.get(requestUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        select: 'name,size,id,lastModifiedDateTime,folder,file,video,image',
      },
    })

    if ('folder' in identityData) {
      const params: Record<string, string | number> = {
        select: 'name,size,id,lastModifiedDateTime,folder,file,video,image',
        $top: Math.max(1, Math.min(200, Number(siteConfig.maxItems) || 100)),
      }
      if (next) params.$skiptoken = next
      if (sort) params.$orderby = sort

      const { data: folderData } = await axios.get(`${requestUrl}${isRoot ? '' : ':'}/children`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params,
      })

      // Extract the next page token from the full @odata.nextLink.
      const nextPage = extractSkipToken(folderData?.['@odata.nextLink'])

      if (!isProtected) setPublicCache(res)
      res.status(200).json(nextPage ? { folder: folderData, next: nextPage } : { folder: folderData })
      return
    }

    if (!isProtected) setPublicCache(res)
    res.status(200).json({ file: identityData })
  } catch (error) {
    setNoStore(res)
    res.status(graphErrorStatus(error)).json({ error: graphErrorMessage(error) })
  }
}
