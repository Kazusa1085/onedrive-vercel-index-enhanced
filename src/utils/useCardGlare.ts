import { useEffect, useRef } from 'react'

/**
 * Tracks the cursor position over the host element as CSS custom properties
 * `--gx` / `--gy` (percentages), consumed by the `.card-glare` layer
 * rendered inside a `.card-glare-host`.
 */
export function useCardGlare<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) return
      const px = (e.clientX - r.left) / r.width
      const py = (e.clientY - r.top) / r.height
      el.style.setProperty('--gx', `${(px * 100).toFixed(1)}%`)
      el.style.setProperty('--gy', `${(py * 100).toFixed(1)}%`)
    }
    const onLeave = () => {
      el.style.removeProperty('--gx')
      el.style.removeProperty('--gy')
    }

    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)
    return () => {
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return ref
}