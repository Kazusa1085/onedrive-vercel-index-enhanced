import type { OdFolderChildren } from '../types'

import Link from 'next/link'
import { FC } from 'react'
import { useClipboard } from 'use-clipboard-copy'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import { getBaseUrl } from '../utils/getBaseUrl'
import { humanFileSize, formatModifiedDateTime } from '../utils/fileDetails'

import { Downloading, ChildIcon, ChildName } from './FileListing'
import { useCardGlare } from '../utils/useCardGlare'
import { buildRawUrl } from '../utils/buildRawUrl'

// Make a span-with-onClick keyboard accessible: Enter/Space trigger the action,
// matching native button semantics.
const activateOnKeyDown =
  (action: () => void) =>
  (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      action()
    }
  }

// Column widths (desktop): Name 7 + Last Modified 2 + Size 1 = 10 tracks inside
// the Link, plus 2 tracks for Actions, filling the 12-track grid completely.
const FileListItem: FC<{ fileContent: OdFolderChildren }> = ({ fileContent: c }) => {
  return (
    <div className="grid grid-cols-10 items-center">
      <div className="col-span-10 flex min-w-0 items-center space-x-2 truncate md:col-span-7" title={c.name}>
        <div className="w-5 shrink-0 text-center">
          <ChildIcon child={c} />
        </div>
        <ChildName name={c.name} folder={Boolean(c.folder)} />
      </div>
      <div className="col-span-2 hidden min-w-0 truncate font-mono text-sm text-(--content-meta) md:block">
        {formatModifiedDateTime(c.lastModifiedDateTime)}
      </div>
      <div className="col-span-1 hidden min-w-0 truncate font-mono text-sm text-(--content-meta) md:block">
        {humanFileSize(c.size)}
      </div>
    </div>
  )
}

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
  const ref = useCardGlare<HTMLDivElement>()
  const getItemPath = (name: string) => `${path === '/' ? '' : path}/${encodeURIComponent(name)}`

  return (
    <div
      ref={ref}
      className="card-glare-host onload-animation relative grid grid-cols-12 items-center transition-all duration-300 ease-in-out hover:bg-(--btn-plain-bg-hover) hover:pl-1"
      style={{ animationDelay: `${Math.min(index, 15) * 40}ms` }}
    >
      <Link href={getItemPath(c.name)} passHref className="col-span-12 md:col-span-10">
        <FileListItem fileContent={c} />
      </Link>

      {c.folder ? (
        <div className="col-span-2 hidden items-center justify-end py-2.5 pr-3 text-(--content-main) md:flex">
          <span
            title="Copy folder permalink"
            role="button"
            tabIndex={0}
            onKeyDown={activateOnKeyDown(() => {
              clipboard.copy(`${getBaseUrl()}${getItemPath(c.name)}`)
              toast('Copied folder permalink.', { icon: '👌' })
            })}
            className="btn-plain cursor-pointer rounded-sm px-1.5 py-1"
            onClick={() => {
              clipboard.copy(`${getBaseUrl()}${getItemPath(c.name)}`)
              toast('Copied folder permalink.', { icon: '👌' })
            }}
          >
            <FontAwesomeIcon icon={['far', 'copy']} />
          </span>
          {folderGenerating[c.id] ? (
            <Downloading title={'Downloading folder, refresh page to cancel'} style="px-1.5 py-1" />
          ) : (
            <span
              title="Download folder"
              role="button"
              tabIndex={0}
              onKeyDown={activateOnKeyDown(() => {
                const p = getItemPath(c.name)
                handleFolderDownload(p, c.id, c.name)()
              })}
              className="btn-plain cursor-pointer rounded-sm px-1.5 py-1"
              onClick={() => {
                const p = getItemPath(c.name)
                handleFolderDownload(p, c.id, c.name)()
              }}
            >
              <FontAwesomeIcon icon={['far', 'arrow-alt-circle-down']} />
            </span>
          )}
        </div>
      ) : (
        <div className="col-span-2 hidden items-center justify-end py-2.5 pr-3 text-(--content-main) md:flex">
          <span
            title="Copy raw file permalink"
            role="button"
            tabIndex={0}
            onKeyDown={activateOnKeyDown(() => {
              clipboard.copy(buildRawUrl(getItemPath(c.name)))
              toast.success('Copied raw file permalink.')
            })}
            className="btn-plain cursor-pointer rounded-sm px-1.5 py-1"
            onClick={() => {
              clipboard.copy(buildRawUrl(getItemPath(c.name)))
              toast.success('Copied raw file permalink.')
            }}
          >
            <FontAwesomeIcon icon={['far', 'copy']} />
          </span>
          <a
            title="Download file"
            className="btn-plain cursor-pointer rounded-sm px-1.5 py-1"
            href={buildRawUrl(getItemPath(c.name))}
          >
            <FontAwesomeIcon icon={['far', 'arrow-alt-circle-down']} />
          </a>
        </div>
      )}
      <div className="card-glare" />
    </div>
  )
}

const FolderListLayout = ({
  path,
  folderChildren,
  folderGenerating,
  handleFolderDownload,
  toast,
}) => {
  const clipboard = useClipboard()

  return (
    <div className="card-base overflow-hidden text-(--content-main)">
      <div className="grid grid-cols-12 items-center border-b border-(--line-divider) px-3">
        <div className="col-span-12 py-2 text-xs font-bold uppercase tracking-widest text-(--content-meta) md:col-span-7">
          Name
        </div>
        <div className="col-span-2 hidden py-2 text-xs font-bold uppercase tracking-widest text-(--content-meta) md:block">
          Last Modified
        </div>
        <div className="col-span-1 hidden py-2 text-xs font-bold uppercase tracking-widest text-(--content-meta) md:block">
          Size
        </div>
        <div className="col-span-2 hidden py-2 text-xs font-bold uppercase tracking-widest text-(--content-meta) md:block">
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