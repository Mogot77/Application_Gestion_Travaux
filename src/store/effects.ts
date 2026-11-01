/* Effets de bord du store : sauvegarde locale, synchronisation Firestore, envoi des photos, sauvegarde à la fermeture. */
import { isAnyOf, type createListenerMiddleware } from '@reduxjs/toolkit'
import { startSync, type Sync } from '@/helpers/sync'
import { applyUploaded, cloudinaryEnabled, uploadLocalPhotos } from '@/helpers/photos'
import { mutated, remoteApplied, replaced } from './appSlice'
import { readySet, syncFailedSet, toast } from './uiSlice'
import { KEY } from './persistence'
import { flushUi } from '@/helpers/uiState'
import { closeModal } from '@/helpers/modal'
import type { AppStore } from './index'

const SAVE_DELAY_MS = 250

/** Démarre les effets ; renvoie la fonction qui les arrête. */
export const startEffects = (store: AppStore, listener: ReturnType<typeof createListenerMiddleware>): (() => void) => {
  let sync: Sync | null = null

  const cache = (): boolean => {
    try { localStorage.setItem(KEY, JSON.stringify(store.getState().app)); return true } catch { return false }
  }
  /** Cache local + envoi des différences à Firestore. */
  const persist = () => {
    if (!cache()) store.dispatch(toast('Stockage local plein : supprimez des photos ou réinitialisez la démo', 'err'))
    sync?.push(store.getState().app)
  }

  // Sauvegarde : tout de suite avec `now` (ou remplacement complet), sinon regroupée sur un court délai.
  const stopSave = listener.startListening({
    matcher: isAnyOf(mutated, replaced),
    effect: async (action, api) => {
      api.cancelActiveListeners()
      if (mutated.match(action) && !action.payload.now) await api.delay(SAVE_DELAY_MS)
      persist()
    },
  })
  const stopRemote = listener.startListening({ actionCreator: remoteApplied, effect: () => { cache() } })

  // Données partagées : Firestore est la source de vérité, le localStorage sert de cache.
  let errored = false
  sync = startSync({
    local: () => store.getState().app,
    apply: fn => { store.dispatch(remoteApplied({ fn })) },
    onReady: () => { store.dispatch(readySet(true)) },
    onError: () => {
      if (errored) return
      errored = true
      store.dispatch(syncFailedSet(true))
      store.dispatch(toast('Synchronisation impossible : vos changements ne sont pas enregistrés en ligne', 'err'))
    },
  })

  // Photos encore locales (créées hors ligne ou avant Cloudinary) : envoyées au chargement et au retour du réseau.
  let busy = false
  const uploadPending = async () => {
    if (busy || !cloudinaryEnabled || !store.getState().ui.ready) return
    busy = true
    try {
      const done = await uploadLocalPhotos(store.getState().app)
      if (done.size) {
        store.dispatch(mutated({ fn: s => { applyUploaded(s, done) }, now: true }))
        store.dispatch(toast(`${done.size} photo(s) envoyée(s) en ligne`, 'ok'))
      }
    } finally { busy = false }
  }
  const stopPhotos = listener.startListening({ actionCreator: readySet, effect: a => { if (a.payload) void uploadPending() } })

  const onUnload = () => { persist(); flushUi() }
  const onVisibility = () => { if (document.visibilityState === 'hidden') onUnload() }
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModal() }
  window.addEventListener('beforeunload', onUnload)
  window.addEventListener('pagehide', onUnload)
  window.addEventListener('hashchange', closeModal)
  window.addEventListener('online', uploadPending)
  document.addEventListener('visibilitychange', onVisibility)
  document.addEventListener('keydown', onKey)

  return () => {
    stopSave(); stopRemote(); stopPhotos()
    sync?.stop(); sync = null
    window.removeEventListener('beforeunload', onUnload)
    window.removeEventListener('pagehide', onUnload)
    window.removeEventListener('hashchange', closeModal)
    window.removeEventListener('online', uploadPending)
    document.removeEventListener('visibilitychange', onVisibility)
    document.removeEventListener('keydown', onKey)
  }
}
