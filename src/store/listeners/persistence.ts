import { isAnyOf } from '@reduxjs/toolkit'
import { mutated, remoteApplied, replaced } from '@/store/reducers'
import { saveState } from '@/store/queries/localCache'
import { clearSync } from '@/store/queries/syncCursor'
import { toast } from '@/store/thunks'
import type { EffectContext } from './types'

const SAVE_DELAY_MS = 250

/** Cache local + envoi des différences à Firestore. */
export const persist = ({ store, cloud }: EffectContext): void => {
  if (!saveState(store.getState().app)) {
    clearSync() // cache non à jour : la prochaine ouverture doit tout relire
    store.dispatch(toast('Stockage local plein : supprimez des photos ou videz le cache local', 'err'))
  }
  cloud.sync?.push(store.getState().app)
}

/** Sauvegarde : tout de suite avec `now` (ou remplacement complet), sinon regroupée sur un court délai. */
export const persistenceEffect = (ctx: EffectContext): (() => void) => {
  const stopSave = ctx.listener.startListening({
    matcher: isAnyOf(mutated, replaced),
    effect: async (action, api) => {
      api.cancelActiveListeners()
      if (mutated.match(action) && !action.payload.now) await api.delay(SAVE_DELAY_MS)
      persist(ctx)
    },
  })
  // Une modification venue de Firestore met à jour le cache, sans rien renvoyer en ligne.
  const stopRemote = ctx.listener.startListening({ actionCreator: remoteApplied, effect: () => { if (!saveState(ctx.store.getState().app)) clearSync() } })
  return () => { stopSave(); stopRemote() }
}
