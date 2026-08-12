import { useEffect, useState } from 'react'

export default function useDeviceOS(): string {
  const [os, setOS] = useState('')

  useEffect(() => {
    const userAgent = window.navigator.userAgent

    if (userAgent.indexOf('Windows') > -1) {
      // Detect OS once on mount; a single setState with no cascading renders.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOS('windows')
    } else if (userAgent.indexOf('Mac OS') > -1) {
      setOS('mac')
    } else if (userAgent.indexOf('Linux') > -1) {
      setOS('linux')
    } else {
      setOS('other')
    }
  }, [])

  return os
}
