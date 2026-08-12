import type { NextApiRequest, NextApiResponse } from 'next'
import apiConfig from '../../../config/api.config'
import siteConfig from '../../../config/site.config'

// Compatibility endpoint for public browser configuration only. OAuth secrets
// never leave Vercel server-side code.
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    res.status(405).end()
    return
  }

  res.status(200).json({
    clientId: apiConfig.clientId,
    userPrincipalName: siteConfig.userPrincipalName,
    baseDirectory: siteConfig.baseDirectory,
  })
}
