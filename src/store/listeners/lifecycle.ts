import { flushUi } from '@/store/local/uiState'
import { closeModal } from '@/store/local/modal'
import { persist } from './persistence'
import type { EffectContext } from './types'

/** Sauvegarde à la fermeture de la page, et fermeture de la modale (Échap, changement de page). */
export const lifecycleEffect = (ctx: EffectContext): (() => void) => {
  const onUnload = () => { persist(ctx); flushUi() }
  const onVisibility = () => { if (document.visibilityState === 'hidden') onUnload() }
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModal() }
  window.addEventListener('beforeunload', onUnload)
  window.addEventListener('pagehide', onUnload)
  window.addEventListener('hashchange', closeModal)
  document.addEventListener('visibilitychange', onVisibility)
  document.addEventListener('keydown', onKey)
  return () => {
    window.removeEventListener('beforeunload', onUnload)
    window.removeEventListener('pagehide', onUnload)
    window.removeEventListener('hashchange', closeModal)
    document.removeEventListener('visibilitychange', onVisibility)
    document.removeEventListener('keydown', onKey)
  }
}
