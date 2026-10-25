import type { NextApiRequest, NextApiResponse } from 'next'
import { default as rawFileHandler } from '../raw'

/** Strip characters that browsers or operating systems reject in filenames. */
function safeFileName(value: unknown): string {
  const raw = Array.isArray(value) ? value[0] : value
  const name = typeof raw === 'string' ? raw : ''
  return name.replace(/[\\/:*?"<>|\r\n]/g, '_').slice(0, 180) || 'download'
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const fileName = safeFileName(req.query.name)
  const asciiFallback = fileName.replace(/[^\x20-\x7e]/g, '_')
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${asciiFallback.replace(/["\\]/g, '_')}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
  )

  await rawFileHandler(req, res)
}
