import { useEffect, useRef, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
// Use the legacy build: it is transpiled for older JS engines, which some
// mobile browsers (e.g. Xiaomi's built-in browser) still lack. The worker must
// come from the same build family as the main library.
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs'
import type { PDFDocumentProxy } from 'pdfjs-dist'

pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/legacy/build/pdf.worker.min.mjs', import.meta.url).toString()

type PDFViewerProps = { url: string; fileSize?: number }

const PDFViewer: React.FC<PDFViewerProps> = ({ url, fileSize }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null)
  const [pageNum, setPageNum] = useState(1)
  const [pageCount, setPageCount] = useState(0)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const [retryCount, setRetryCount] = useState(0)
  // 'range' streams the PDF in small chunks; if that fails (some mobile
  // networks/proxies break partial-content responses), retry once with a
  // single full download before giving up.
  const [mode, setMode] = useState<'range' | 'full'>('range')

  useEffect(() => {
    let cancelled = false
    // Reset on url/retry change; single setState, no cascading renders.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus('loading')
    setErrorMsg('')

    // Providing `length` lets pdf.js skip the initial whole-file probe and
    // start chunked range requests immediately, avoiding slow full downloads
    // that time out on mobile connections.
    const params =
      mode === 'range'
        ? { url, rangeChunkSize: 65536, ...(fileSize && fileSize > 0 ? { length: fileSize } : {}) }
        : { url, disableRange: true }

    pdfjs
      .getDocument(params)
      .promise.then(pdf => {
        if (cancelled) return
        setDoc(pdf)
        setPageCount(pdf.numPages)
        setStatus('ready')
      })
      .catch(e => {
        if (cancelled) return
        if (mode === 'range') {
          setMode('full')
          return
        }
        setErrorMsg(e?.message ?? 'Failed to load the PDF')
        setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [url, retryCount, mode, fileSize])

  useEffect(() => {
    if (status !== 'ready' || !doc || !containerRef.current) return
    const container = containerRef.current
    let cancelled = false
    const renderPage = async () => {
      try {
        const page = await doc.getPage(pageNum)
        if (cancelled) return
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        const baseViewport = page.getViewport({ scale: 1 })
        const scale = (container.clientWidth / baseViewport.width) * dpr
        const viewport = page.getViewport({ scale })
        const canvas = document.createElement('canvas')
        canvas.width = Math.floor(viewport.width)
        canvas.height = Math.floor(viewport.height)
        canvas.style.width = `${Math.floor(viewport.width / dpr)}px`
        canvas.style.height = `${Math.floor(viewport.height / dpr)}px`
        container.innerHTML = ''
        container.appendChild(canvas)
        await page.render({ canvas, viewport }).promise
      } catch {
        if (!cancelled) setStatus('error')
      }
    }
    renderPage()
    return () => {
      cancelled = true
    }
  }, [doc, pageNum, status])

  if (status === 'loading') {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-(--content-secondary)">
        Loading PDF…
      </div>
    )
  }

  // Never fall back to an iframe pointing at the PDF: many mobile browsers
  // (especially Chinese ones like QQ/UC/Quark) treat that as a download trigger.
  // Show an error with a manual open link instead.
  if (status === 'error') {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center space-y-3 p-4 text-center text-sm text-(--content-secondary)">
        <div className="font-medium text-(--content-main)">无法加载 PDF 预览</div>
        <div className="max-w-full truncate text-xs opacity-70">{errorMsg}</div>
        <div className="flex items-center space-x-3">
          <button
            className="btn-plain border border-(--line-divider) px-3 py-1.5"
            onClick={() => {
              setMode('range')
              setRetryCount(c => c + 1)
            }}
          >
            重试
          </button>
          <a href={url} target="_blank" rel="noopener noreferrer" className="btn-plain border border-(--line-divider) px-3 py-1.5">
            在新标签页打开
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-sm">
      <div className="flex w-full items-center justify-between border-b border-(--line-divider) bg-(--card-bg-transparent) px-3 py-2 text-sm text-(--content-main)">
        <button
          className="btn-plain flex h-8 w-8 items-center justify-center disabled:opacity-40"
          onClick={() => setPageNum(n => Math.max(1, n - 1))}
          disabled={pageNum <= 1}
          aria-label="Previous page"
        >
          <FontAwesomeIcon className="h-4 w-4" icon="arrow-left" />
        </button>
        <span className="tabular-nums">
          {pageNum} / {pageCount}
        </span>
        <button
          className="btn-plain flex h-8 w-8 items-center justify-center disabled:opacity-40"
          onClick={() => setPageNum(n => Math.min(pageCount, n + 1))}
          disabled={pageNum >= pageCount}
          aria-label="Next page"
        >
          <FontAwesomeIcon className="h-4 w-4" icon="arrow-right" />
        </button>
      </div>
      <div
        ref={containerRef}
        className="flex w-full flex-1 flex-col items-center overflow-y-auto bg-gray-100 p-2 dark:bg-gray-900"
      />
    </div>
  )
}

export default PDFViewer