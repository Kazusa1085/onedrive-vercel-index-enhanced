import { Dispatch, Fragment, SetStateAction, useRef, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useClipboard } from 'use-clipboard-copy'

import { getBaseUrl } from '../utils/getBaseUrl'
import { getStoredToken } from '../utils/protectedRouteHandler'
import { getReadablePath } from '../utils/getReadablePath'
import { buildRawUrl } from '../utils/buildRawUrl'

function LinkContainer({ title, value }: { title: string; value: string }) {
  const clipboard = useClipboard({ copiedTimeout: 1000 })
  return (
    <>
      <h4 className="py-2 text-xs font-medium uppercase tracking-wider text-(--content-meta)">{title}</h4>
      <div className="group relative mb-2 max-h-24 overflow-y-auto break-all rounded-lg border border-(--line-divider) bg-(--surface-sunken) p-2.5 pr-11 font-mono">
        <div className="text-(--content-main)">{value}</div>
        <button
          type="button"
          aria-label={`Copy ${title}`}
          onClick={() => clipboard.copy(value)}
          className="btn-plain absolute top-1 right-1 flex h-8 w-8 items-center justify-center rounded-md border border-(--glass-border) bg-(--surface-raised) text-(--content-main) opacity-100 transition-opacity duration-100 hover:bg-(--btn-plain-bg-hover) md:opacity-0 md:group-hover:opacity-100"
        >
          {clipboard.copied ? <FontAwesomeIcon icon="check" /> : <FontAwesomeIcon icon="copy" />}
        </button>
      </div>
    </>
  )
}

export default function CustomEmbedLinkMenu({
  path,
  menuOpen,
  setMenuOpen,
}: {
  path: string
  menuOpen: boolean
  setMenuOpen: Dispatch<SetStateAction<boolean>>
}) {
  const hashedToken = getStoredToken(path)

  // Focus on input automatically when menu modal opens
  const focusInputRef = useRef<HTMLInputElement>(null)
  const closeMenu = () => setMenuOpen(false)

  const readablePath = getReadablePath(path)
  const filename = readablePath.substring(readablePath.lastIndexOf('/') + 1)
  const [name, setName] = useState(filename)
  const encodedName = encodeURIComponent(name.trim() || filename)

  // The API decodes the query value once, so the human-readable variant must
  // start from a decoded path. The already-encoded variant (`path` from
  // Next's asPath) is inserted verbatim to avoid double-encoding.
  const decodedPath = path
    .split('/')
    .map(segment => {
      try {
        return decodeURIComponent(segment)
      } catch {
        return segment
      }
    })
    .join('/')

  const customLink = (pathValue: string, alreadyEncoded: boolean) => {
    const queryPath = alreadyEncoded ? pathValue : encodeURIComponent(pathValue)
    const token = hashedToken ? `&odpt=${encodeURIComponent(hashedToken)}` : ''
    return `${getBaseUrl()}/api/name/${encodedName}?path=${queryPath}${token}`
  }

  return (
    <Transition appear show={menuOpen} as={Fragment}>
      <Dialog as="div" className="fixed inset-0 z-10 overflow-y-auto" onClose={closeMenu} initialFocus={focusInputRef}>
        <div className="min-h-screen px-4 text-center">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-100"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-(--page-bg) opacity-80 backdrop-blur-sm" />
          </Transition.Child>

          {/* This element is to trick the browser into centering the modal contents. */}
          <span className="inline-block h-screen align-middle" aria-hidden="true">
            &#8203;
          </span>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-100"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-100"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <div className="card-base inline-block max-h-[80vh] w-full max-w-3xl transform overflow-hidden overflow-y-auto p-4 text-left align-middle text-sm text-(--content-main)">
              <Dialog.Title as="h3" className="py-2 text-xl font-bold">
                {'Customise direct link'}
              </Dialog.Title>
              <Dialog.Description as="p" className="py-2 text-(--content-meta)">
                <>
                  {'Change the raw file direct link to a URL ending with the extension of the file.'}{' '}
                  <a
                    href="https://ovi.swo.moe/docs/features/customise-direct-link"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-(--primary-text) underline underline-offset-2"
                  >
                    {'What is this?'}
                  </a>
                </>
              </Dialog.Description>

              <div className="mt-4">
                <h4 className="py-2 text-xs font-medium uppercase tracking-wider">{'Filename'}</h4>
                <input
                  className="mb-2 w-full rounded-lg border border-(--line-divider) bg-(--surface-sunken) p-2.5 font-mono text-(--content-main) focus:outline-hidden"
                  ref={focusInputRef}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  aria-label="Custom filename"
                />

                <LinkContainer title={'Default'} value={buildRawUrl(readablePath)} />
                <LinkContainer title={'URL encoded'} value={buildRawUrl(path)} />
                <LinkContainer title={'Customised'} value={customLink(decodedPath, false)} />
                <LinkContainer title={'Customised and encoded'} value={customLink(path, true)} />
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  )
}
