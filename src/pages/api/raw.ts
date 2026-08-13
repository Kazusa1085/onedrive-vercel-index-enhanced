import { posix as pathPosix } from 'path'

import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

import { driveApi, cacheControlHeader } from '../../../config/api.config'
import { encodePath, getAccessToken, checkAuthRoute } from '.'

// Raw files are fetched cross-origin by the browser's built-in PDF viewer
// (and by any third-party tool), so the response must carry CORS headers.
// We set them explicitly: the `cors` npm package has been observed to not
// reliably emit headers on Vercel serverless functions.
export function setCorsHeaders(res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Range, If-None-Match, If-Modified-Since')
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const accessToken = await getAccessToken()
  if (!accessToken) {
    res.status(403).json({ error: 'No access token.' })
    return
  }

  const { path = '/', odpt = '', proxy = false } = req.query

  // Handle a CORS preflight request. It must be answered even when the
  // requested path is protected (a 401 here would be invisible to fetch).
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res)
    res.status(204).end()
    return
  }

  // Sometimes the path parameter is defaulted to '[...path]' which we need to handle
  if (path === '[...path]') {
    res.status(400).json({ error: 'No path specified.' })
    return
  }
  // If the path is not a valid path, return 400
  if (typeof path !== 'string') {
    res.status(400).json({ error: 'Path query invalid.' })
    return
  }
  const cleanPath = pathPosix.resolve('/', pathPosix.normalize(path))

  // Handle protected routes authentication
  const odTokenHeader = (req.headers['od-protected-token'] as string) ?? odpt

  const { code, message } = await checkAuthRoute(cleanPath, accessToken, odTokenHeader)
  // Status code other than 200 means user has not authenticated yet
  if (code !== 200) {
    setCorsHeaders(res)
    res.status(code).json({ error: message })
    return
  }
  // If message is empty, then the path is not protected.
  // Conversely, protected routes are not allowed to serve from cache.
  if (message !== '') {
    res.setHeader('Cache-Control', 'no-cache')
  }

  setCorsHeaders(res)
  try {
    // Handle response from OneDrive API
    const requestUrl = `${driveApi}/root${encodePath(cleanPath)}`
    const { data } = await axios.get(requestUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        // OneDrive international version fails when only selecting the downloadUrl (what a stupid bug)
        select: 'id,size,@microsoft.graph.downloadUrl',
      },
    })

    if ('@microsoft.graph.downloadUrl' in data) {
      // Proxy raw file content instead of redirecting. Streaming the response
      // through keeps CORS headers and stable content-type, and lets the
      // browser's native viewers render (iframes) without being hijacked by
      // the OneDrive CDN's `Content-Disposition: attachment`, which would
      // turn every preview into a download.
      if (proxy) {
        // Forward the client's Range request to the CDN so browsers can seek
        // (the native PDF viewer sends one to stream-render large files).
        const rangeHeader = req.headers.range
        const { headers, data: stream, status } = await axios.get(data['@microsoft.graph.downloadUrl'] as string, {
          responseType: 'stream',
          headers: rangeHeader
            ? { Range: Array.isArray(rangeHeader) ? rangeHeader[0] : rangeHeader }
            : undefined,
        })
        // Only forward a whitelist of headers from the OneDrive CDN response,
        // never blindly pass through everything (which may contain internal details).
        // `content-disposition` is deliberately filtered out as CDN serves
        // `attachment`, which would make browsers download instead of preview.
        const odHeaders: Record<string, string> = {}
        for (const headerName of ['content-type', 'content-length', 'etag', 'last-modified', 'accept-ranges', 'content-range']) {
          const value = headers[headerName]
          if (value !== undefined && value !== null) {
            odHeaders[headerName] = String(value)
          }
        }
        // The CDN often serves `application/octet-stream`, which makes the
        // browser download the file instead of rendering it. Assert a real
        // content type from the extension so previews stay previews.
        if (/\.pdf$/i.test(cleanPath)) {
          odHeaders['content-type'] = 'application/pdf'
        }
        // Protected routes are not allowed to serve from cache: never
        // overwrite the no-cache header set above for protected paths.
        // Range responses (used by pdf.js to stream PDFs in chunks) must never
        // be cached on the edge either: Vercel's cache key does not include the
        // Range header, so a cached chunk would be served to a different range
        // request and corrupt the document. PDFs are private content and are
        // fully excluded from shared caches; stale-while-revalidate can
        // otherwise keep serving an aborted/partial response on refresh.
        odHeaders['Cache-Control'] =
          /\.pdf$/i.test(cleanPath) || req.headers.range || message !== '' ? 'no-store' : cacheControlHeader
        // Send data stream as response (pass through 206 Partial Content,
        // a 200 here would confuse the browser's range logic)
        res.writeHead(status ?? 200, odHeaders)
        stream.pipe(res)
      } else {
        res.redirect(data['@microsoft.graph.downloadUrl'])
      }
    } else {
      res.status(404).json({ error: 'No download url found.' })
    }
    return
  } catch (error) {
    const err = error as { response?: { status?: number; data?: unknown } }
    res.status(err.response?.status ?? 500).json({ error: err.response?.data ?? 'Internal server error.' })
    return
  }
}
