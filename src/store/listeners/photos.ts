import { applyUploaded, cloudinaryEnabled, uploadLocalPhotos } from '@/helpers/photos'
import { mutated, readySet } from '@/store/reducers'
import { toast } from '@/store/thunks'
import type { EffectContext } from './types'

/** Photos encore locales (créées hors ligne ou avant Cloudinary) : envoyées au chargement et au retour du réseau. */
export const photosEffect = ({ store, listener }: EffectContext): (() => void) => {
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
  const stop = listener.startListening({ actionCreator: readySet, effect: a => { if (a.payload) void uploadPending() } })
  window.addEventListener('online', uploadPending)
  return () => { stop(); window.removeEventListener('online', uploadPending) }
}
