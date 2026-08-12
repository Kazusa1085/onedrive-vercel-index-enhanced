import axios from 'axios'
import type { NextApiRequest, NextApiResponse } from 'next'

import { getAccessToken } from '.'
import apiConfig from '../../../config/api.config'
import { isProtectedGraphPath } from '../../utils/protectedRouteHandler'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Get access token from storage
  const accessToken = await getAccessToken()

  // Get item details (specifically, its path) by its unique ID in OneDrive
  const { id = '' } = req.query

  // Set edge function caching for faster load times, check docs:
  // https://vercel.com/docs/concepts/functions/edge-caching
  res.setHeader('Cache-Control', apiConfig.cacheControlHeader)

  // Return error 403 if access_token is empty
  if (!accessToken) {
    res.status(403).json({ error: 'No access token.' })
    return
  }

  if (typeof id === 'string') {
    const itemApi = `${apiConfig.driveApi}/items/${id}`

    try {
      const { data } = await axios.get(itemApi, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          select: 'id,name,parentReference',
        },
      })
      // Never leak the location of items under protected routes:
      // pretend the item does not exist.
      if (isProtectedGraphPath(data.parentReference?.path ?? '')) {
        res.status(404).json({ error: 'Item not found.' })
        return
      }
      res.status(200).json(data)
    } catch (error) {
      const err = error as { response?: { status?: number; data?: unknown } }
      res.status(err.response?.status ?? 500).json({ error: err.response?.data ?? 'Internal server error.' })
    }
  } else {
    res.status(400).json({ error: 'Invalid driveItem ID.' })
  }
  return
}
