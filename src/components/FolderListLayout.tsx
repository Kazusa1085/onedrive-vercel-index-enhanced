import type { OdFolderChildren } from '../types'

import Link from 'next/link'
import { useClipboard } from 'use-clipboard-copy'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import { getBaseUrl } from '../utils/getBaseUrl'
import { humanFileSize, formatModifiedDateTime } from '../utils/fileDetails'

import { Downloading, ChildIcon, ChildName } from './FileListing'
import { buildRawUrl } from '../utils/buildRawUrl'

// Column widths (desktop): Name 6 + Last Modified 3 + Size 1 + Actions 2 =
// 12 tracks. The header and every row share this exact same grid so columns
// stay aligned. px-5 keeps comfortable inner spacing like the markdown card.
const FolderRow = ({
  c,
  index,
  path,
  clipboard,
  folderGenerating,
  handleFolderDownload,
  toast,
}: {
  c: OdFolderChildren
  index: number
  path: string
  clipboard: ReturnType<typeof useClipboard>
  folderGenerating: { [key: string]: boolean }
  handleFolderDownload: (path: string, id: string, name?: string) => () => void
  toast: typeof import('react-hot-toast').default
}) => {
  const getItemPath = (name: string) => `${path === '/' ? '' : path}/${encodeURIComponent(name)}`
  const itemPath = getItemPath(c.name)
  const sizeLabel = c.folder ? `${c.folder.childCount ?? 0} items` : humanFileSize(c.size)

  return (
    <div
      className="onload-animation relative grid grid-cols-12 items-center px-4 transition-colors duration-200 hover:bg-(--btn-plain-bg-hover) sm:px-5"
      style={{ animationDelay: `${Math.min(index, 10) * 50}ms` }}
    >
      <Link href={itemPath} className="absolute inset-0 z-0" aria-label={`Open ${c.name}`} />

      <div className="pointer-events-none relative z-10 col-span-7 flex min-w-0 items-center gap-2.5 py-2.5 md:col-span-6">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center">
          <ChildIcon child={c} />
        </span>
        <div className="min-w-0">
          <ChildName name={c.name} folder={Boolean(c.folder)} />
          <div className="mt-0.5 truncate font-mono text-xs text-(--content-meta) md:hidden">
            {formatModifiedDateTime(c.lastModifiedDateTime)}
          </div>
        </div>
      </div>

      <div className="col-span-3 hidden min-w-0 truncate py-2.5 font-mono text-sm text-(--content-meta) md:block">
        {formatModifiedDateTime(c.lastModifiedDateTime)}
      </div>
      <div className="col-span-3 min-w-0 truncate py-2.5 font-mono text-sm text-(--content-meta) md:col-span-1">
        {sizeLabel}
      </div>

      <div className="relative z-20 col-span-2 flex items-center justify-end gap-1 py-2 text-(--content-main)">
        {/* Mobile: download only */}
        {c.folder ? (
          <button
            type="button"
            title="Download folder"
            aria-label={`Download folder ${c.name}`}
            className="btn-plain flex h-10 w-10 items-center justify-center rounded-lg md:hidden"
            onClick={() => handleFolderDownload(itemPath, c.id, c.name)()}
          >
            <FontAwesomeIcon icon={['far', 'arrow-alt-circle-down']} />
          </button>
        ) : (
          <a
            title="Download file"
            aria-label={`Download file ${c.name}`}
            className="btn-plain flex h-10 w-10 items-center justify-center rounded-lg md:hidden"
            href={buildRawUrl(itemPath)}
          >
            <FontAwesomeIcon icon={['far', 'arrow-alt-circle-down']} />
          </a>
        )}

        {/* Desktop: full actions */}
        <div className="hidden items-center gap-1 md:flex">
          {c.folder ? (
            <>
              <button
                type="button"
                title="Copy folder permalink"
                aria-label={`Copy link for folder ${c.name}`}
                className="btn-plain flex h-10 w-10 items-center justify-center rounded-lg"
                onClick={() => {
                  clipboard.copy(`${getBaseUrl()}${itemPath}`)
                  toast('Copied folder permalink.', { icon: '👌' })
                }}
              >
                <FontAwesomeIcon icon={['far', 'copy']} />
              </button>
              {folderGenerating[c.id] ? (
                <Downloading
                  title={'Downloading folder, refresh page to cancel'}
                  style="flex h-10 w-10 items-center justify-center"
                />
              ) : (
                <button
                  type="button"
                  title="Download folder"
                  aria-label={`Download folder ${c.name}`}
                  className="btn-plain flex h-10 w-10 items-center justify-center rounded-lg"
                  onClick={() => handleFolderDownload(itemPath, c.id, c.name)()}
                >
                  <FontAwesomeIcon icon={['far', 'arrow-alt-circle-down']} />
                </button>
              )}
            </>
          ) : (
            <>
              <button
                type="button"
                title="Copy raw file permalink"
                aria-label={`Copy link for file ${c.name}`}
                className="btn-plain flex h-10 w-10 items-center justify-center rounded-lg"
                onClick={() => {
                  clipboard.copy(buildRawUrl(itemPath))
                  toast.success('Copied raw file permalink.')
                }}
              >
                <FontAwesomeIcon icon={['far', 'copy']} />
              </button>
              <a
                title="Download file"
                aria-label={`Download file ${c.name}`}
                className="btn-plain flex h-10 w-10 items-center justify-center rounded-lg"
                href={buildRawUrl(itemPath)}
              >
                <FontAwesomeIcon icon={['far', 'arrow-alt-circle-down']} />
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

interface FolderListLayoutProps {
  path: string
  folderChildren: OdFolderChildren[]
  folderGenerating: { [key: string]: boolean }
  handleFolderDownload: (path: string, id: string, name?: string) => () => void
  toast: typeof import('react-hot-toast').default
}

const FolderListLayout = ({
  path,
  folderChildren,
  folderGenerating,
  handleFolderDownload,
  toast,
}: FolderListLayoutProps) => {
  const clipboard = useClipboard()

  return (
    <div className="card-base overflow-hidden text-(--content-main)">
      <div className="grid grid-cols-12 items-center border-b border-(--line-divider) px-4 sm:px-5">
        <div className="col-span-7 py-2.5 text-xs font-semibold uppercase tracking-wider text-(--content-meta) md:col-span-6">
          Name
        </div>
        <div className="col-span-3 hidden py-2.5 text-xs font-semibold uppercase tracking-wider text-(--content-meta) md:block">
          Last Modified
        </div>
        <div className="col-span-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-(--content-meta) md:col-span-1">
          Size
        </div>
        <div className="col-span-2 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-(--content-meta)">
          Actions
        </div>
      </div>

      {folderChildren.map((c: OdFolderChildren, i: number) => (
        <FolderRow
          key={c.id}
          c={c}
          index={i}
          path={path}
          clipboard={clipboard}
          folderGenerating={folderGenerating}
          handleFolderDownload={handleFolderDownload}
          toast={toast}
        />
      ))}
    </div>
  )
}

export default FolderListLayout
