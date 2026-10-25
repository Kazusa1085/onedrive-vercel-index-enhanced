import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

import apiConfig from '../../../config/api.config'
import type { OdThumbnail } from '../../types'
import {
  checkAuthRoute,
  encodePath,
  getAccessToken,
  getProtectedToken,
  normalizePath,
  queryString,
  setNoStore,
  setPublicCache,
} from '../../utils/onedriveApi'

const VALID_SIZES = new Set(['large', 'medium', 'small'])
const MAX_PATH_LENGTH = 2048

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD')
    res.status(405).end()
    return
  }

  setNoStore(res)

  const pathParam = queryString(req.query.path, '')
  const size = queryString(req.query.size, 'medium')
  if (!VALID_SIZES.has(size)) {
    res.status(400).json({ error: 'Invalid size' })
    return
  }
  if (pathParam === '[...path]') {
    res.status(400).json({ error: 'No path specified.' })
    return
  }
  if (pathParam.length === 0 || pathParam.length > MAX_PATH_LENGTH) {
    res.status(400).json({ error: 'Path query invalid.' })
    return
  }

  const cleanPath = normalizePath(pathParam)
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
  if (message === '') setPublicCache(res)

  const requestPath = encodePath(cleanPath)
  const isRoot = requestPath === ''

  try {
    const { data } = await axios.get(`${apiConfig.driveApi}/root${requestPath}${isRoot ? '' : ':'}/thumbnails`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    const thumbnail = Array.isArray(data?.value) ? (data.value[0] as OdThumbnail | undefined) : undefined
    const thumbnailUrl = thumbnail?.[size as 'large' | 'medium' | 'small']?.url
    if (typeof thumbnailUrl === 'string' && thumbnailUrl.length > 0) {
      res.redirect(302, thumbnailUrl)
    } else {
      res.status(404).json({ error: "The item doesn't have a valid thumbnail." })
    }
  } catch (error) {
    setNoStore(res)
    const status = (error as { response?: { status?: number } })?.response?.status
    const data = (error as { response?: { data?: unknown } })?.response?.data
    res.status(typeof status === 'number' && status >= 400 ? status : 500).json({
      error: data ?? 'Internal server error.',
    })
  }
}
