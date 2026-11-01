import type { Theme } from '@/helpers/theme'

export type LoginViewProps = {
  theme: Theme
  /** E-mail du compte connecté mais non autorisé (absent si personne n'est connecté). */
  email?: string
  /** `denied` : compte hors liste blanche ; `error` : droits non vérifiables ; absent si l'écran n'est pas bloquant. */
  blocked?: 'denied' | 'error'
  error?: string
  onLogin: () => void
  onLogout: () => void
  onToggleTheme: () => void
}
