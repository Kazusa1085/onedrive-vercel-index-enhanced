import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

import apiConfig from '../../../config/api.config'
import { isProtectedGraphItem } from '../../utils/protectedRouteHandler'
import { getAccessToken, queryString, setNoStore, setPublicCache } from '../../utils/onedriveApi'

const MAX_ITEM_ID_LENGTH = 1024

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    res.status(405).end()
    return
  }

  setNoStore(res)

  const id = queryString(req.query.id)
  if (id.length === 0 || id.length > MAX_ITEM_ID_LENGTH) {
    res.status(400).json({ error: 'Invalid driveItem ID.' })
    return
  }

  const accessToken = await getAccessToken()
  if (!accessToken) {
    res.status(403).json({ error: 'No access token.' })
    return
  }

  try {
    const { data } = await axios.get(`${apiConfig.driveApi}/items/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        select: 'id,name,parentReference',
      },
    })

    const parentPath = queryString(data?.parentReference?.path)
    // Without a parent path we cannot prove that the item is outside every
    // protected route. Fail closed rather than leaking metadata.
    if (!parentPath) {
      res.status(404).json({ error: 'Item not found.' })
      return
    }

    if (isProtectedGraphItem(parentPath, queryString(data?.name))) {
      res.status(404).json({ error: 'Item not found.' })
      return
    }

    setPublicCache(res)
    res.status(200).json(data)
  } catch (error) {
    setNoStore(res)
    const status = (error as { response?: { status?: number } })?.response?.status
    res.status(typeof status === 'number' && status >= 400 ? status : 500).json({
      error: status === 404 ? 'Item not found.' : 'Failed to load item.',
    })
  }
}
