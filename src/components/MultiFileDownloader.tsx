import { NextRouter } from 'next/router'
import toast from 'react-hot-toast'
import JSZip from 'jszip'

import { fetcher } from '../utils/fetchWithSWR'
import { getStoredToken } from '../utils/protectedRouteHandler'
import type { OdAPIResponse, OdFolderChildren } from '../types'

/**
 * A loading toast component with file download progress support
 * @param props
 * @param props.router Next router instance, used for reloading the page
 * @param props.progress Current downloading and compression progress (returned by jszip metadata)
 */
export function DownloadingToast({ router, progress }: { router: NextRouter; progress?: string }) {
  return (
    <div className="flex items-center space-x-2">
      <div className="w-56">
        <span>Downloading {progress ? `${progress}%` : '...'}</span>

        <div className="relative mt-2">
          <div className="flex h-1 overflow-hidden rounded-sm bg-gray-100">
            <div style={{ width: `${progress}%` }} className="bg-gray-500 text-white transition-all duration-100"></div>
          </div>
        </div>
      </div>
      <button
        className="rounded bg-red-500 p-2 text-white hover:bg-red-400 focus:outline-hidden focus:ring-3 focus:ring-red-300"
        onClick={() => router.reload()}
      >
        Cancel
      </button>
    </div>
  )
}

// Blob download helper
export function downloadBlob({ blob, name }: { blob: Blob; name: string }) {
  // Prepare for download
  const el = document.createElement('a')
  el.style.display = 'none'
  document.body.appendChild(el)

  // Download zip file
  const bUrl = window.URL.createObjectURL(blob)
  el.href = bUrl
  el.download = name
  el.click()
  window.URL.revokeObjectURL(bUrl)
  el.remove()
}

/**
 * Download a single folder tree after compressing it into a zip
 * @param toastId Toast ID to be used for toast notification
 * @param files Files to be downloaded. Array of file and folder items excluding root folder.
 * Folder items MUST be in front of its children items in the array.
 * Use async generator because generation of the array may be slow.
 * When waiting for its generation, we can meanwhile download bodies of already got items.
 * Only folder items can have url undefined.
 * @param basePath Root dir path of files to be downloaded
 * @param folder Optional folder name to hold files, otherwise flatten files in the zip
 */
export async function downloadTreelikeMultipleFiles({
  toastId,
  router,
  files,
  basePath,
  folder,
}: {
  toastId: string
  router: NextRouter
  files: AsyncGenerator<{
    name?: string
    url?: string
    path: string
    isFolder: boolean
  }>
  basePath: string
  folder?: string
}): Promise<void> {
  const zip = new JSZip()
  const root = folder ? zip.folder(folder)! : zip
  const map = [{ path: basePath, dir: root }]

  // Add selected file blobs to zip according to its path
  for await (const { name, url, path, isFolder } of files) {
    // Search parent dir in map
    const i = map
      .slice()
      .reverse()
      .findIndex(
        ({ path: parent }) =>
          path.substring(0, parent.length) === parent && path.substring(parent.length + 1).indexOf('/') === -1
      )
    if (i === -1) {
      throw new Error('File array does not satisfy requirement')
    }

    // Add file or folder to zip
    const dir = map[map.length - 1 - i].dir
    if (isFolder) {
      map.push({ path, dir: dir.folder(name ?? '')! })
    } else {
      dir.file(
        name ?? '',
        fetch(url!).then(r => r.blob())
      )
    }
  }

  // Create zip file and download it
  const b = await zip.generateAsync({ type: 'blob' }, metadata => {
    toast.loading(<DownloadingToast router={router} progress={metadata.percent.toFixed(0)} />, {
      id: toastId,
    })
  })
  downloadBlob({ blob: b, name: folder ? folder + '.zip' : 'download.zip' })
}

interface TraverseItem {
  path: string
  meta?: Partial<OdFolderChildren>
  isFolder: boolean
  error?: { status: number; message: string }
}

// Task result of genTask: either the fetched folder response, or a handled
// request error (genTask never rejects, so errors are resolved as values).
type TaskResult =
  | { i: number; path: string; data: OdAPIResponse }
  | { i: number; path: string; error: { status: number; message: unknown } }

/**
 * One-shot concurrent top-down file traversing for the folder.
 * Due to react hook limit, we cannot reuse SWR utils for recursive actions.
 * We will directly fetch API and arrange responses instead.
 * In folder tree, we visit folders top-down as concurrently as possible.
 * Every time we visit a folder, we fetch and return meta of all its children.
 * If folders have pagination, partically retrieved items are not returned immediately,
 * but after all children of the folder have been successfully retrieved.
 * If an error occurred in paginated fetching, all children will be dropped.
 * @param path Folder to be traversed. The path should be cleaned in advance.
 * @returns Array of items representing folders and files of traversed folder top-down and excluding root folder.
 * Due to top-down, Folder items are ALWAYS in front of its children items.
 * Error key in the item will contain the error when there is a handleable error.
 */
export async function* traverseFolder(path: string): AsyncGenerator<TraverseItem, void, undefined> {
  const hashedToken = getStoredToken(path)

  // Generate the task passed to Promise.race to request a folder
  const genTask = async (i: number, path: string, next?: string): Promise<TaskResult> => {
    try {
      const data = await fetcher<OdAPIResponse>([
        next ? `/api/?path=${path}&next=${next}` : `/api?path=${path}`,
        hashedToken ?? undefined,
      ])
      return { i, path, data }
    } catch (error) {
      const err = error as { status?: number; message?: unknown }
      return { i, path, error: { status: err.status ?? 500, message: err.message ?? 'Request failed' } }
    }
  }

  // Pool containing Promises of folder requests
  const pool = [genTask(0, path)]

  // Map as item buffer for folders with pagination
  const buf: { [k: string]: TraverseItem[] } = {}

  // filter(() => true) removes gaps in the array
  while (pool.filter(() => true).length > 0) {
    const info = await Promise.race(pool.filter(() => true))
    const { i, path } = info

    // genTask resolves errors into the `error` branch (it never rejects), so
    // 4xx responses can be handled as yieldable items instead of crashing the download
    if ('error' in info) {
      delete pool[i]
      const status = info.error.status
      if (Math.floor(status / 100) === 4) {
        yield {
          path,
          meta: {},
          isFolder: true,
          error: { status, message: typeof info.error.message === 'string' ? info.error.message : 'Request failed' },
        }
        continue
      }
      throw info.error
    }

    const { data } = info
    if (!data.folder) {
      throw new Error('Path is not folder')
    }
    delete pool[i]

    const items = data.folder.value.map((c: OdFolderChildren) => {
      const p = `${path === '/' ? '' : path}/${encodeURIComponent(c.name)}`
      return { path: p, meta: c, isFolder: Boolean(c.folder) }
    }) as TraverseItem[]

    if (data.next) {
      buf[path] = (buf[path] ?? []).concat(items)

      // Append next page task to the pool at the end
      const i = pool.length
      pool[i] = genTask(i, path, data.next)
    } else {
      const allItems = (buf[path] ?? []).concat(items)
      if (buf[path]) {
        delete buf[path]
      }

      allItems
        .filter(item => item.isFolder)
        .forEach(item => {
          // Append new folder tasks to the pool at the end
          const i = pool.length
          pool[i] = genTask(i, item.path)
        })
      yield* allItems
    }
  }
}
