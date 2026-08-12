import { Fragment } from 'react'
import { IconProp } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Listbox, Transition } from '@headlessui/react'

import useLocalStorage from '../utils/useLocalStorage'

export const layouts: Array<{ id: number; name: 'Grid' | 'List'; icon: IconProp }> = [
  { id: 1, name: 'List', icon: 'th-list' },
  { id: 2, name: 'Grid', icon: 'th' },
]

const SwitchLayout = () => {
  const [preferredLayout, setPreferredLayout] = useLocalStorage('preferredLayout', layouts[0])

  return (
    <div className="relative w-24 shrink-0 text-sm text-(--content-main) md:w-28">
      <Listbox value={preferredLayout} onChange={setPreferredLayout}>
        <Listbox.Button className="relative w-full cursor-pointer rounded-sm pl-4">
          <span className="pointer-events-none flex items-center">
            <FontAwesomeIcon className="mr-2 h-3 w-3" icon={preferredLayout.icon} />
            <span>{preferredLayout.name}</span>
          </span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <FontAwesomeIcon className="h-3 w-3" icon="chevron-down" />
          </span>
        </Listbox.Button>

        <Transition
          as={Fragment}
          enter="transition duration-100 ease-out"
          enterFrom="transform scale-95 opacity-0"
          enterTo="transform scale-100 opacity-100"
          leave="transition duration-75 ease-out"
          leaveFrom="transform scale-100 opacity-100"
          leaveTo="transform scale-95 opacity-0"
        >
          <Listbox.Options className="absolute right-0 z-20 mt-1 w-32 overflow-auto rounded-xl border border-(--line-divider) bg-(--card-bg-transparent) py-1 shadow-(--card-shadow) backdrop-blur-xl focus:outline-hidden">
            {layouts.map(layout => (
              <Listbox.Option
                key={layout.id}
                className={`${
                  layout.name === preferredLayout.name &&
                  'bg-(--primary)/10 text-(--title-active)'
                } relative flex cursor-pointer select-none items-center py-1.5 pl-3 text-(--content-main) hover:opacity-80`}
                value={layout}
              >
                <FontAwesomeIcon className="mr-2 h-3 w-3" icon={layout.icon} />
                <span className={layout.name === preferredLayout.name ? 'font-medium' : 'font-normal'}>
                  {layout.name}
                </span>
                {layout.name === preferredLayout.name && (
                  <span className="absolute inset-y-0 right-3 flex items-center">
                    <FontAwesomeIcon className="h-3 w-3" icon="check" />
                  </span>
                )}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </Transition>
      </Listbox>
    </div>
  )
}

export default SwitchLayout
