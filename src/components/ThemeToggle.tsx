import { Fragment } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { IconProp } from '@fortawesome/fontawesome-svg-core'

import { useTheme, type ThemeMode } from '../utils/useTheme'

const options: Array<{ value: ThemeMode; label: string; icon: IconProp }> = [
  { value: 'system', label: 'System', icon: 'circle-half-stroke' },
  { value: 'light', label: 'Light', icon: 'sun' },
  { value: 'dark', label: 'Dark', icon: 'moon' },
]

export default function ThemeToggle() {
  const { mode, setTheme } = useTheme()
  const current = options.find(option => option.value === mode) ?? options[0]

  return (
    <Menu as="div" className="relative shrink-0">
      <Menu.Button
        className="btn-plain flex h-9 w-9 items-center justify-center rounded-lg"
        title={`Theme: ${current.label}`}
        aria-label={`Theme: ${current.label}`}
      >
        <FontAwesomeIcon className="h-4 w-4" icon={current.icon} />
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition duration-100 ease-out"
        enterFrom="scale-95 opacity-0"
        enterTo="scale-100 opacity-100"
        leave="transition duration-75 ease-in"
        leaveFrom="scale-100 opacity-100"
        leaveTo="scale-95 opacity-0"
      >
        <Menu.Items className="absolute right-0 top-full z-[120] mt-2 w-36 overflow-hidden rounded-xl border border-(--glass-border) bg-(--surface-solid) p-1 text-sm shadow-(--card-shadow-hover) focus:outline-hidden">
          {options.map(option => (
            <Menu.Item key={option.value}>
              {({ active }) => (
                <button
                  type="button"
                  onClick={() => setTheme(option.value)}
                  className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors ${
                    active ? 'bg-(--btn-plain-bg-hover)' : ''
                  } ${mode === option.value ? 'text-(--primary-text)' : 'text-(--content-main)'}`}
                >
                  <FontAwesomeIcon className="h-3.5 w-3.5" icon={option.icon} />
                  <span className="flex-1">{option.label}</span>
                  {mode === option.value && <FontAwesomeIcon className="h-3 w-3" icon="check" />}
                </button>
              )}
            </Menu.Item>
          ))}
        </Menu.Items>
      </Transition>
    </Menu>
  )
}
