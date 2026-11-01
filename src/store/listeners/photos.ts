import { PHOTO_LOCAL_EVENT, applyUploaded, cloudinaryEnabled, uploadLocalPhotos } from '@/helpers/photos'
import { mutated, readySet } from '@/store/reducers'
import { toast } from '@/store/thunks'
import type { EffectContext } from './types'

const RETRY_PHOTOS_MS = 30000

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
  // Une photo restée locale : on prévient (une fois par rafale) et on retente peu après.
  let warned: number | undefined
  const onLocal = () => {
    if (warned === undefined) {
      store.dispatch(toast('Envoi en ligne impossible : la photo est gardée sur cet appareil et sera envoyée plus tard', 'err'))
      warned = window.setTimeout(() => { warned = undefined }, 10000)
    }
    window.setTimeout(() => { void uploadPending() }, RETRY_PHOTOS_MS)
  }
  window.addEventListener('online', uploadPending)
  window.addEventListener(PHOTO_LOCAL_EVENT, onLocal)
  return () => {
    stop()
    window.clearTimeout(warned)
    window.removeEventListener('online', uploadPending)
    window.removeEventListener(PHOTO_LOCAL_EVENT, onLocal)
  }
}
