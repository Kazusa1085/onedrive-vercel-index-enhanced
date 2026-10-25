import { useCallback, useEffect, useRef, useState } from 'react'

export type ThemeMode = 'system' | 'light' | 'dark'
export type ResolvedTheme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'theme-mode'
const THEME_EVENT = 'theme-mode-change'

function broadcastThemeChange(): void {
  window.dispatchEvent(new Event(THEME_EVENT))
}

export function resolveTheme(mode: ThemeMode, systemDark: boolean): ResolvedTheme {
  if (mode === 'dark') return 'dark'
  if (mode === 'light') return 'light'
  return systemDark ? 'dark' : 'light'
}

export function readStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'system'
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    return stored === 'light' || stored === 'dark' ? stored : 'system'
  } catch {
    return 'system'
  }
}

export function applyResolvedTheme(theme: ResolvedTheme): void {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
}

/**
 * Three-state theme controller: system / light / dark.
 *
 * The initial attribute is written by the tiny pre-hydration script in
 * `_document.tsx`, so there is no flash before React mounts.
 */
export function useTheme() {
  const [mode, setModeState] = useState<ThemeMode>('system')
  const [systemDark, setSystemDark] = useState(false)
  const appliedOnce = useRef(false)

  useEffect(() => {
    // Read the persisted preference after hydration; the pre-hydration script
    // already applied the visual theme, this only syncs the React control.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setModeState(readStoredTheme())

    const query = window.matchMedia('(prefers-color-scheme: dark)')
    setSystemDark(query.matches)

    const syncFromStorage = () => {
      setModeState(readStoredTheme())
      setSystemDark(query.matches)
    }
    const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches)
    query.addEventListener('change', onChange)
    window.addEventListener(THEME_EVENT, syncFromStorage)
    window.addEventListener('storage', syncFromStorage)
    return () => {
      query.removeEventListener('change', onChange)
      window.removeEventListener(THEME_EVENT, syncFromStorage)
      window.removeEventListener('storage', syncFromStorage)
    }
  }, [])

  const resolved = resolveTheme(mode, systemDark)

  useEffect(() => {
    // On the first client render the state above may still be the server
    // default. Do not overwrite the pre-hydration theme with that temporary
    // value; the next render (after the stored mode is read) applies the
    // correct theme.
    if (!appliedOnce.current) {
      appliedOnce.current = true
      const current = document.documentElement.dataset.theme
      if (current && current !== resolved) return
    }
    applyResolvedTheme(resolved)
  }, [resolved])

  const setTheme = useCallback((next: ThemeMode) => {
    setModeState(next)
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      // Storage can be unavailable in private modes; the in-memory state still works.
    }
    broadcastThemeChange()
  }, [])

  const cycleTheme = useCallback(() => {
    const next: ThemeMode = mode === 'system' ? 'light' : mode === 'light' ? 'dark' : 'system'
    setTheme(next)
  }, [mode, setTheme])

  return { mode, resolved, setTheme, cycleTheme }
}
