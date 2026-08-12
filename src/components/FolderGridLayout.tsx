import type { OdFolderChildren } from '../types'

import Link from 'next/link'
import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useClipboard } from 'use-clipboard-copy'

import { getBaseUrl } from '../utils/getBaseUrl'
import { formatModifiedDateTime } from '../utils/fileDetails'
import { ChildIcon, ChildName, Downloading } from './FileListing'
import { useCardGlare } from '../utils/useCardGlare'
import { getStoredToken } from '../utils/protectedRouteHandler'
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

const GridItem = ({ c, path }: { c: OdFolderChildren; path: string }) => {
  // We use the generated medium thumbnail for rendering preview images (excluding folders)
  const hashedToken = getStoredToken(path)
  const thumbnailUrl =
    'folder' in c ? null : `/api/thumbnail/?path=${path}&size=medium${hashedToken ? `&odpt=${hashedToken}` : ''}`

  // Some thumbnails are broken, so we check for onerror event in the image component
  const [brokenThumbnail, setBrokenThumbnail] = useState(false)

  return (
    <div className="space-y-2">
      <div className="h-32 overflow-hidden rounded-xl border border-(--line-divider) transition-all duration-200 group-hover:rounded-2xl">
        {thumbnailUrl && !brokenThumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
            <img
              className="h-full w-full object-cover object-top"
              src={thumbnailUrl}
              alt={c.name}
              loading="lazy"
              decoding="async"
              onError={() => setBrokenThumbnail(true)}
          />
        ) : (
          <div className="relative flex h-full w-full items-center justify-center rounded-lg">
            <ChildIcon child={c} />
            <span className="absolute bottom-0 right-0 m-1 font-medium text-(--content-meta)">
              {c.folder?.childCount}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-start justify-center space-x-2">
        <span className="w-5 shrink-0 text-center">
          <ChildIcon child={c} />
        </span>
        <ChildName name={c.name} folder={Boolean(c.folder)} />
      </div>
      <div className="truncate text-center font-mono text-xs text-(--content-meta)">
        {formatModifiedDateTime(c.lastModifiedDateTime)}
      </div>
    </div>
  )
}

const FolderGridItem = ({
  c,
  path,
  index,
  clipboard,
  folderGenerating,
  handleFolderDownload,
  toast,
}: {
  c: OdFolderChildren
  path: string
  index: number
  clipboard: ReturnType<typeof useClipboard>
  folderGenerating: { [key: string]: boolean }
  handleFolderDownload: (path: string, id: string, name?: string) => () => void
  toast: typeof import('react-hot-toast').default
}) => {
  const ref = useCardGlare<HTMLDivElement>()

  // Get item path from item name
  const getItemPath = (name: string) => `${path === '/' ? '' : path}/${encodeURIComponent(name)}`

  return (
    <div
      ref={ref}
      className="card-glare-host group onload-animation relative overflow-hidden rounded-xl transition-all duration-300 ease-in-out hover:-translate-y-1 hover:bg-(--btn-plain-bg-hover) hover:shadow-(--card-shadow-hover)"
      style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}
    >
      <div className="absolute top-0 right-0 z-10 m-1 rounded-sm bg-white/50 py-0.5 opacity-100 transition-all duration-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 dark:bg-gray-900/50">
        {c.folder ? (
          <div>
            <span
              title="Copy folder permalink"
              aria-label={`Copy link for folder ${c.name}`}
              role="button"
              tabIndex={0}
              onKeyDown={activateOnKeyDown(() => {
                clipboard.copy(`${getBaseUrl()}${getItemPath(c.name)}`)
                toast('Copied folder permalink.', { icon: '👌' })
              })}
              className="btn-plain flex h-8 w-8 cursor-pointer items-center justify-center rounded-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-(--primary)"
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
                aria-label={`Download folder ${c.name}`}
                role="button"
                tabIndex={0}
                onKeyDown={activateOnKeyDown(handleFolderDownload(getItemPath(c.name), c.id, c.name))}
                className="btn-plain flex h-8 w-8 cursor-pointer items-center justify-center rounded-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-(--primary)"
                onClick={handleFolderDownload(getItemPath(c.name), c.id, c.name)}
              >
                <FontAwesomeIcon icon={['far', 'arrow-alt-circle-down']} />
              </span>
            )}
          </div>
        ) : (
          <div>
            <span
              title="Copy raw file permalink"
              aria-label={`Copy link for file ${c.name}`}
              role="button"
              tabIndex={0}
              onKeyDown={activateOnKeyDown(() => {
                clipboard.copy(buildRawUrl(getItemPath(c.name)))
                toast.success('Copied raw file permalink.')
              })}
              className="btn-plain flex h-8 w-8 cursor-pointer items-center justify-center rounded-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-(--primary)"
              onClick={() => {
                clipboard.copy(buildRawUrl(getItemPath(c.name)))
                toast.success('Copied raw file permalink.')
              }}
            >
                    <FontAwesomeIcon icon={['far', 'copy']} />
                  </span>
                  <a
                    title="Download file"
                    aria-label={`Download file ${c.name}`}
                    className="btn-plain flex h-8 w-8 cursor-pointer items-center justify-center rounded-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-(--primary)"
                    href={buildRawUrl(getItemPath(c.name))}
                  >
                    <FontAwesomeIcon icon={['far', 'arrow-alt-circle-down']} />
                  </a>
                </div>
              )}
            </div>

            <Link href={getItemPath(c.name)} passHref>
              <GridItem c={c} path={getItemPath(c.name)} />
            </Link>
            <div className="card-glare" />
        </div>
  )
}

const FolderGridLayout = ({
  path,
  folderChildren,
  folderGenerating,
  handleFolderDownload,
  toast,
}) => {
  const clipboard = useClipboard()

  return (
    <div className="card-base overflow-hidden text-(--content-main)">
      <div className="flex items-center border-b border-(--line-divider) px-5 py-2 text-xs font-bold uppercase tracking-widest text-(--content-meta)">
        <div className="flex-1">{folderChildren.length} items</div>
      </div>

      <div className="grid grid-cols-2 gap-4 px-5 py-4 md:grid-cols-4">
        {folderChildren.map((c: OdFolderChildren, i: number) => (
          <FolderGridItem
            key={c.id}
            c={c}
            path={path}
            index={i}
            clipboard={clipboard}
            folderGenerating={folderGenerating}
            handleFolderDownload={handleFolderDownload}
            toast={toast}
          />
        ))}
      </div>
    </div>
  )
}

export default FolderGridLayout
