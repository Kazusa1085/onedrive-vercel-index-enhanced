import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

import apiConfig from '../../../config/api.config'
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

// File bodies are intentionally streamed, not JSON. The default Next.js 4 MB
// response warning is therefore expected for large previews.
export const config = {
  api: {
    responseLimit: false,
  },
}

const MIME_BY_EXTENSION: Record<string, string> = {
  avif: 'image/avif',
  bmp: 'image/bmp',
  css: 'text/css; charset=utf-8',
  csv: 'text/csv; charset=utf-8',
  gif: 'image/gif',
  html: 'text/html; charset=utf-8',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  js: 'text/javascript; charset=utf-8',
  json: 'application/json; charset=utf-8',
  m4a: 'audio/mp4',
  md: 'text/markdown; charset=utf-8',
  mp3: 'audio/mpeg',
  mp4: 'video/mp4',
  pdf: 'application/pdf',
  png: 'image/png',
  svg: 'image/svg+xml',
  txt: 'text/plain; charset=utf-8',
  webm: 'video/webm',
  webp: 'image/webp',
}

function inferContentType(path: string, fallback: string | undefined): string {
  const extension = path.split('.').pop()?.toLowerCase() ?? ''
  return MIME_BY_EXTENSION[extension] ?? fallback ?? 'application/octet-stream'
}

function statusFromError(error: unknown): number {
  const status = (error as { response?: { status?: number } })?.response?.status
  return typeof status === 'number' && status >= 400 ? status : 500
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // A CORS preflight must be answered before touching Redis or OneDrive. A 401
  // here would be invisible to `fetch` and look like a network failure.
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res)
    res.status(204).end()
    return
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    setCorsHeaders(res)
    res.setHeader('Allow', 'GET, HEAD, OPTIONS')
    res.status(405).end()
    return
  }

  const pathParam = queryString(req.query.path, '/')
  if (pathParam === '[...path]') {
    setCorsHeaders(res)
    res.status(400).json({ error: 'No path specified.' })
    return
  }
  if (pathParam.length > MAX_PATH_LENGTH) {
    setCorsHeaders(res)
    res.status(414).json({ error: 'Path is too long.' })
    return
  }

  const cleanPath = normalizePath(pathParam)
  const accessToken = await getAccessToken()
  if (!accessToken) {
    setCorsHeaders(res)
    setNoStore(res)
    res.status(403).json({ error: 'No access token.' })
    return
  }

  const protectedToken = getProtectedToken(req, req.query.odpt)
  const { code, message } = await checkAuthRoute(cleanPath, accessToken, protectedToken)
  if (code !== 200) {
    setCorsHeaders(res)
    setNoStore(res)
    res.status(code).json({ error: message })
    return
  }

  setCorsHeaders(res)
  if (message !== '') setNoStore(res)

  try {
    const requestUrl = `${apiConfig.driveApi}/root${encodePath(cleanPath)}`
    const { data } = await axios.get(requestUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        // OneDrive international fails when only selecting the downloadUrl.
        select: 'id,size,@microsoft.graph.downloadUrl',
      },
    })

    const downloadUrl = data?.['@microsoft.graph.downloadUrl']
    if (typeof downloadUrl !== 'string' || downloadUrl.length === 0) {
      setNoStore(res)
      res.status(404).json({ error: 'No download url found.' })
      return
    }

    // Proxy mode keeps CORS headers and a stable content type so browser
    // viewers (PDF.js, native media players) do not get hijacked by the CDN's
    // `Content-Disposition: attachment`.
    if (queryFlag(req.query.proxy)) {
      const rangeHeader = req.headers.range
      const {
        headers,
        data: stream,
        status,
      } = await axios.request({
        method: req.method === 'HEAD' ? 'HEAD' : 'GET',
        url: downloadUrl,
        responseType: 'stream',
        headers: rangeHeader ? { Range: Array.isArray(rangeHeader) ? rangeHeader[0] : rangeHeader } : undefined,
      })

      // Only forward a whitelist of headers from the OneDrive CDN response.
      // `content-disposition` is deliberately filtered out: the CDN serves
      // `attachment`, which would turn every preview into a download.
      const responseHeaders: Record<string, string> = {}
      for (const headerName of ['content-length', 'etag', 'last-modified', 'accept-ranges', 'content-range']) {
        const value = headers[headerName]
        if (value !== undefined && value !== null) {
          responseHeaders[headerName] = String(value)
        }
      }

      const isPdf = /\.pdf$/i.test(cleanPath)
      const upstreamType = headers['content-type']
      const fallbackType = Array.isArray(upstreamType)
        ? upstreamType[0]
        : typeof upstreamType === 'string'
          ? upstreamType
          : undefined
      responseHeaders['content-type'] = inferContentType(cleanPath, fallbackType)
      // A proxied response is displayed inline on our origin. `sandbox`
      // neutralises script execution for HTML/SVG while leaving PDF.js and
      // other byte consumers unaffected.
      responseHeaders['content-security-policy'] = "sandbox; default-src 'none'"
      responseHeaders['x-content-type-options'] = 'nosniff'

      if (message !== '' || isPdf || rangeHeader) {
        setNoStore(res)
        responseHeaders['cdn-cache-control'] = 'no-store'
        responseHeaders['pragma'] = 'no-cache'
      } else {
        setPublicCache(res)
      }
      // `res.writeHead` merges headers set above with this object, so CORS and
      // cache headers survive the transition to a streaming response.
      responseHeaders['cache-control'] = String(res.getHeader('cache-control') ?? 'no-store')
      responseHeaders['access-control-allow-origin'] = '*'
      responseHeaders['access-control-allow-methods'] = 'GET, HEAD, OPTIONS'
      responseHeaders['access-control-expose-headers'] =
        'Accept-Ranges, Content-Disposition, Content-Length, Content-Range, Content-Type, ETag, Last-Modified'

      res.writeHead(status ?? 200, responseHeaders)
      if (req.method === 'HEAD') {
        stream?.destroy?.()
        res.end()
      } else {
        stream.on('error', (streamError: Error) => {
          console.error(`OneDrive stream failed: ${streamError.message}`)
          if (!res.headersSent) {
            res.status(502).json({ error: 'Failed to stream file.' })
          } else {
            res.destroy(streamError)
          }
        })
        stream.pipe(res)
      }
      return
    }

    if (message !== '') {
      setNoStore(res)
    } else {
      setPublicCache(res)
    }
    res.redirect(302, downloadUrl)
  } catch (error) {
    setNoStore(res)
    const status = statusFromError(error)
    const data = (error as { response?: { data?: unknown } })?.response?.data
    res.status(status).json({
      error: typeof data === 'string' ? data : 'Failed to fetch file.',
    })
  }
}
