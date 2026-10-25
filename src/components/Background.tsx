import { useEffect, useRef, useState } from 'react'
import siteConfig from '../../config/site.config'

/**
 * Full-screen background.
 *
 * Default: Aurora — four large oklch blobs tinted from `--hue` drifting on
 * their own CSS animations, while JS steers each layer at a different speed
 * toward the cursor (layered parallax) for a subtle depth effect.
 *
 * If siteConfig.backgroundImage / randomBackgrounds is configured, the image
 * is rendered instead (under a page-tinted overlay for readability).
 */
const Background = () => {
  const fixedImage = siteConfig.backgroundImage
  // Start with the deterministic value on both server and client so React
  // hydration never sees two different random picks. The random pool is only
  // consulted after mount, when it cannot cause a hydration mismatch.
  const [image, setImage] = useState(fixedImage)

  useEffect(() => {
    let nextImage = fixedImage
    if (!nextImage) {
      const pool = siteConfig.randomBackgrounds ?? []
      if (pool.length === 0) return
      nextImage = pool[Math.floor(Math.random() * pool.length)]
    }
    // The random pool must be sampled after hydration, so this is a deliberate
    // external-store read rather than derived state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setImage(nextImage)
  }, [fixedImage])

  const blobShells = useRef<Array<HTMLDivElement | null>>([])

  // Layered parallax: move each blob layer toward the cursor with a damped
  // lerp, every layer at its own speed factor for depth (GPU-friendly).
  useEffect(() => {
    if (image || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    const speeds = [0.015, 0.03, 0.045, 0.06]
    let raf = 0

    const onMove = (e: MouseEvent) => {
      target.x = e.clientX
      target.y = e.clientY
    }

    const tick = () => {
      const vw = window.innerWidth / 2
      const vh = window.innerHeight / 2
      blobShells.current.forEach((el, i) => {
        if (!el) return
        const k = speeds[i % speeds.length]
        const tx = (target.x - vw) * k
        const ty = (target.y - vh) * k
        const cx = parseFloat(el.dataset.x ?? '0')
        const cy = parseFloat(el.dataset.y ?? '0')
        const nx = cx + (tx - cx) * 0.15
        const ny = cy + (ty - cy) * 0.15
        el.dataset.x = String(nx)
        el.dataset.y = String(ny)
        el.style.transform = `translate(${nx.toFixed(1)}px, ${ny.toFixed(1)}px)`
      })
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    window.addEventListener('mousemove', onMove)
    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [image])

  if (image) {
    return (
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${image})` }} />
        <div className="absolute inset-0 bg-(--page-bg)/50" />
      </div>
    )
  }

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-(--page-bg)" aria-hidden="true">
      {(['s1', 's2', 's3', 's4'] as const).map((pos, i) => (
        <div
          key={pos}
          ref={el => {
            blobShells.current[i] = el
          }}
          className={`blob-shell ${pos}`}
        >
          <div className={`blob b${i + 1}`} />
        </div>
      ))}
    </div>
  )
}

export default Background
