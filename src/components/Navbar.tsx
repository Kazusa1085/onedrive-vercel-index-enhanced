import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { IconName } from '@fortawesome/fontawesome-svg-core'
import { Dialog, Transition } from '@headlessui/react'
import toast, { Toaster } from 'react-hot-toast'
import { useHotkeys } from 'react-hotkeys-hook'

import Link from 'next/link'
import { useRouter } from 'next/router'
import { Fragment, useEffect, useState } from 'react'

import siteConfig from '../../config/site.config'
import SearchModal from './SearchModal'
import useDeviceOS from '../utils/useDeviceOS'

const Navbar = () => {
  const router = useRouter()
  const os = useDeviceOS()

  const [tokenPresent, setTokenPresent] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const [searchOpen, setSearchOpen] = useState(false)
  const openSearchBox = () => setSearchOpen(true)

  useHotkeys(`${os === 'mac' ? 'meta' : 'ctrl'}+k`, e => {
    if (!siteConfig.searchEnabled) return
    openSearchBox()
    e.preventDefault()
  })

  useEffect(() => {
    const storedToken = () => {
      for (const r of siteConfig.protectedRoutes) {
        if (Object.prototype.hasOwnProperty.call(localStorage, r)) {
          return true
        }
      }
      return false
    }
    // Reads localStorage once on mount; no cascading renders.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTokenPresent(storedToken())
  }, [])

  const clearTokens = () => {
    setIsOpen(false)

    siteConfig.protectedRoutes.forEach(r => {
      localStorage.removeItem(r)
    })

    toast.success('Cleared all tokens')
    setTimeout(() => {
      router.reload()
    }, 1000)
  }

  return (
    <div className="sticky top-2 z-100 w-full">
      <Toaster />

      <SearchModal searchOpen={searchOpen} setSearchOpen={setSearchOpen} />

      <div className="mx-auto w-full max-w-5xl px-4">
        <div className="flex w-full items-center justify-between space-x-4 rounded-2xl border border-(--line-divider) bg-(--card-bg-transparent) px-4 py-1 shadow-(--card-shadow-hover) backdrop-blur-md transition-all duration-300 ease-out hover:-translate-y-0.5">
          <Link href="/" passHref className="flex min-w-0 items-center space-x-2 py-2 hover:opacity-80 dark:text-white md:p-2">
            {/* Plain <img> instead of next/image so remote URLs work for siteConfig.icon */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={siteConfig.icon} alt="icon" width="25" height="25" />
            <span className="truncate font-bold">{siteConfig.title}</span>
          </Link>

        <div className="flex min-w-0 flex-1 items-center justify-end space-x-4 text-(--content-main) md:flex-initial">
          {siteConfig.searchEnabled && (
            <button
              className="flex flex-1 items-center justify-between rounded-lg bg-gray-100 px-2.5 py-1.5 hover:opacity-80 dark:bg-gray-800 dark:text-white md:w-48"
              onClick={openSearchBox}
            >
              <div className="flex items-center space-x-2">
                <FontAwesomeIcon className="h-4 w-4" icon="search" />
                <span className="truncate text-sm font-medium">Search ...</span>
              </div>

              <div className="hidden items-center space-x-1 md:flex">
                <div className="rounded-lg bg-gray-200 px-2 py-1 text-xs font-medium dark:bg-gray-700">
                  {os === 'mac' ? '⌘' : 'Ctrl'}
                </div>
                <div className="rounded-lg bg-gray-200 px-2 py-1 text-xs font-medium dark:bg-gray-700">K</div>
              </div>
            </button>
          )}

          {siteConfig.links.length !== 0 &&
            siteConfig.links.map((l: { name: string; link: string }) => (
              <a
                key={l.name}
                href={l.link}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-plain flex items-center gap-2 px-2.5 py-1.5"
              >
                <FontAwesomeIcon className="h-4 w-4" icon={['fab', l.name.toLowerCase() as IconName]} />
                <span className="hidden text-sm font-medium md:inline-block">{l.name}</span>
              </a>
            ))}

          {siteConfig.email && (
            <a
              href={siteConfig.email}
              className="btn-plain flex items-center gap-2 px-2.5 py-1.5"
            >
              <FontAwesomeIcon className="h-4 w-4" icon={['far', 'envelope']} />
              <span className="hidden text-sm font-medium md:inline-block">{'Email'}</span>
            </a>
          )}

          {tokenPresent && (
            <button
              className="btn-plain flex items-center gap-2 px-2.5 py-1.5"
              onClick={() => setIsOpen(true)}
            >
              <span className="hidden text-sm font-medium md:inline-block">{'Logout'}</span>
              <FontAwesomeIcon className="h-4 w-4" icon="sign-out-alt" />
            </button>
          )}
        </div>
      </div>

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="fixed inset-0 z-10 overflow-y-auto" open={isOpen} onClose={() => setIsOpen(false)}>
          <div className="min-h-screen px-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-100"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-50"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-gray-50 dark:bg-gray-800" />
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
              leave="ease-in duration-50"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <div className="my-8 inline-block w-full max-w-md transform overflow-hidden rounded-lg p-6 text-left align-middle transition-all card-base">
                <Dialog.Title className="text-lg font-bold text-(--content-main)">
                  Clear all tokens?
                </Dialog.Title>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    These tokens are used to authenticate yourself into password protected folders, clearing them means
                    that you will need to re-enter the passwords again.
                  </p>
                </div>

                <div className="mt-4 max-h-32 overflow-y-scroll font-mono text-sm text-(--content-main)">
                  {siteConfig.protectedRoutes.map((r, i) => (
                    <div key={i} className="flex items-center space-x-1">
                      <FontAwesomeIcon icon="key" />
                      <span className="truncate">{r}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex items-center justify-end">
                  <button
                    className="mr-3 inline-flex items-center justify-center space-x-2 rounded-sm bg-blue-500 px-4 py-2 text-white hover:bg-blue-400 focus:outline-hidden focus:ring-3 focus:ring-blue-300"
                    onClick={() => setIsOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="inline-flex items-center justify-center space-x-2 rounded-sm bg-red-500 px-4 py-2 text-white hover:bg-red-400 focus:outline-hidden focus:ring-3 focus:ring-red-300"
                    onClick={() => clearTokens()}
                  >
                    <FontAwesomeIcon icon={['far', 'trash-alt']} />
                    <span>Clear all</span>
                  </button>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
      </div>
    </div>
  )
}

export default Navbar