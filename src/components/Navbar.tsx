import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { IconName } from '@fortawesome/fontawesome-svg-core'
import { Dialog, Transition } from '@headlessui/react'
import toast from 'react-hot-toast'
import { useHotkeys } from 'react-hotkeys-hook'

import Link from 'next/link'
import { useRouter } from 'next/router'
import { Fragment, useEffect, useState } from 'react'

import siteConfig from '../../config/site.config'
import SearchModal from './SearchModal'
import ThemeToggle from './ThemeToggle'
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
        if (localStorage.getItem(r) !== null) {
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
    <div className="sticky top-2 z-[100] w-full">
      <SearchModal searchOpen={searchOpen} setSearchOpen={setSearchOpen} />

      <div className="mx-auto w-full max-w-5xl px-4">
        <div className="flex w-full items-center justify-between space-x-4 rounded-2xl border border-(--glass-border) bg-(--card-bg-transparent) px-4 py-1 shadow-(--card-shadow) backdrop-blur-md">
          <Link
            href="/"
            passHref
            className="flex min-w-0 max-w-[55%] items-center space-x-2 py-2 pr-2 hover:opacity-80 sm:max-w-none md:p-2"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-(--glass-border) bg-(--surface-raised)">
              {/* Plain <img> instead of next/image so remote URLs work for siteConfig.icon */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={siteConfig.icon} alt="" width="22" height="22" className="h-[22px] w-[22px] object-contain" />
            </span>
            <span className="truncate font-bold">{siteConfig.title}</span>
          </Link>

          <div className="flex min-w-0 shrink-0 items-center justify-end space-x-2 pl-1 text-(--content-main) sm:space-x-3 md:flex-initial">
            {siteConfig.searchEnabled && (
              <button
                className="flex flex-1 items-center justify-between rounded-lg border border-(--glass-border) bg-(--surface-sunken) px-2.5 py-1.5 transition-colors hover:bg-(--btn-plain-bg-hover) md:w-48"
                onClick={openSearchBox}
              >
                <div className="flex items-center space-x-2">
                  <FontAwesomeIcon className="h-4 w-4" icon="search" />
                  <span className="truncate text-sm font-medium">Search ...</span>
                </div>

                <div className="hidden items-center space-x-1 md:flex">
                  <div className="rounded-md bg-(--btn-plain-bg-hover) px-2 py-1 text-xs font-medium">
                    {os === 'mac' ? '⌘' : 'Ctrl'}
                  </div>
                  <div className="rounded-md bg-(--btn-plain-bg-hover) px-2 py-1 text-xs font-medium">K</div>
                </div>
              </button>
            )}

            <ThemeToggle />

            {siteConfig.links.length !== 0 &&
              siteConfig.links.map((l: { name: string; link: string }) => (
                <a
                  key={l.name}
                  href={l.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-plain flex h-9 items-center gap-2 rounded-lg px-2.5"
                >
                  <FontAwesomeIcon className="h-4 w-4" icon={['fab', l.name.toLowerCase() as IconName]} />
                  <span className="hidden text-sm font-medium md:inline-block">{l.name}</span>
                </a>
              ))}

            {siteConfig.email && (
              <a href={siteConfig.email} className="btn-plain flex h-9 items-center gap-2 rounded-lg px-2.5">
                <FontAwesomeIcon className="h-4 w-4" icon={['far', 'envelope']} />
                <span className="hidden text-sm font-medium md:inline-block">{'Email'}</span>
              </a>
            )}

            {tokenPresent && (
              <button
                className="btn-plain flex h-9 items-center gap-2 rounded-lg px-2.5"
                onClick={() => setIsOpen(true)}
              >
                <span className="hidden text-sm font-medium md:inline-block">{'Logout'}</span>
                <FontAwesomeIcon className="h-4 w-4" icon="sign-out-alt" />
              </button>
            )}
          </div>
        </div>

        <Transition appear show={isOpen} as={Fragment}>
          <Dialog
            as="div"
            className="fixed inset-0 z-10 overflow-y-auto"
            open={isOpen}
            onClose={() => setIsOpen(false)}
          >
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
                <div className="fixed inset-0 bg-(--page-bg) opacity-80" />
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
                  <Dialog.Title className="text-lg font-bold text-(--content-main)">Clear all tokens?</Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-(--content-meta)">
                      These tokens are used to authenticate yourself into password protected folders, clearing them
                      means that you will need to re-enter the passwords again.
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
                      className="btn-plain mr-3 border border-(--line-divider) px-4 py-2"
                      onClick={() => setIsOpen(false)}
                    >
                      Cancel
                    </button>
                    <button className="btn-danger" onClick={() => clearTokens()}>
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
