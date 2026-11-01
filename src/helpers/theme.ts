/* Thème clair / sombre : choix mémorisé, sinon préférence du système. L'attribut data-theme de <html> pilote les jetons CSS. */
export type Theme = 'light' | 'dark'

export const THEME_KEY = 'equalis-theme'

export const systemTheme = (): Theme => (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')

/** Thème enregistré par l'utilisateur, ou `null` s'il suit le système. */
export const storedTheme = (): Theme | null => {
  try {
    const v = localStorage.getItem(THEME_KEY)
    return v === 'light' || v === 'dark' ? v : null
  } catch { return null }
}

export const currentTheme = (): Theme => storedTheme() ?? systemTheme()

export const applyTheme = (t: Theme): void => { document.documentElement.dataset.theme = t }

export const saveTheme = (t: Theme): void => {
  try { localStorage.setItem(THEME_KEY, t) } catch { /* stockage indisponible : le choix ne sera pas gardé */ }
}
