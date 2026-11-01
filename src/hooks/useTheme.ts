import { useCallback, useEffect, useState } from 'react'
import { applyTheme, currentTheme, saveTheme, storedTheme, systemTheme, type Theme } from '@/helpers/theme'

/** Thème courant et bascule clair / sombre. Sans choix enregistré, on suit le système (y compris quand il change). */
export const useTheme = (): { theme: Theme; toggle: () => void } => {
  const [theme, setTheme] = useState<Theme>(currentTheme)

  useEffect(() => { applyTheme(theme) }, [theme])

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (!mq) return
    const onChange = () => { if (!storedTheme()) setTheme(systemTheme()) }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const toggle = useCallback(() => {
    setTheme(t => {
      const next: Theme = t === 'dark' ? 'light' : 'dark'
      saveTheme(next)
      return next
    })
  }, [])

  return { theme, toggle }
}
