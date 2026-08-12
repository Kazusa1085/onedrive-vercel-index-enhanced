import { useRouter } from 'next/router'
import { FC } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { buildRawUrl } from '../../utils/buildRawUrl'
import DownloadButtonGroup from '../DownloadBtnGtoup'
import { DownloadBtnContainer } from './Containers'
import PDFViewer from './PDFViewer'
import type { OdFileObject } from '../../types'

const PDFEmbedPreview: FC<{ file: OdFileObject }> = ({ file: _file }) => {
  const { asPath } = useRouter()

  // Render PDFs with pdf.js (canvas) instead of the browser's native viewer:
  // many mobile browsers (especially Chinese ones like QQ/UC/Quark) ignore
  // iframes pointing at PDFs and fall back to downloading the file, while the
  // pdf.js based viewer renders the document itself so it always previews.
  // `proxy=true` streams the file through raw.ts, keeping a stable
  // `application/pdf` response with CORS headers.
  // Note: `asPath` is already URL-encoded; it must be interpolated verbatim,
  // the same way the other previews build their raw URLs. Wrapping it in
  // encodeURIComponent double-encodes (e.g. '%20' -> '%2520'), which makes
  // Graph return itemNotFound ("The resource could not be found.").
  const rawUrl = buildRawUrl(asPath, { proxy: true })

  return (
    <div>
      <div className="w-full overflow-hidden rounded-sm" style={{ height: '90vh' }}>
        <PDFViewer key={rawUrl} url={rawUrl} fileSize={_file.size} />
      </div>
      <DownloadBtnContainer>
        <div className="flex items-center justify-between space-x-2">
          <a
            href={rawUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-plain flex items-center space-x-2 px-3 py-1.5 text-sm"
          >
            <span>Open in new tab</span>
            <FontAwesomeIcon icon="external-link-alt" />
          </a>
          <DownloadButtonGroup />
        </div>
      </DownloadBtnContainer>
    </div>
  )
}

export default PDFEmbedPreview