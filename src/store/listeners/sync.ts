import { startSync } from '@/store/queries/appSync'
import { remoteApplied, readySet, syncFailedSet } from '@/store/reducers'
import { toast } from '@/store/thunks'
import type { EffectContext } from './types'

/** Données partagées : Firestore est la source de vérité, le localStorage sert de cache. */
export const syncEffect = (ctx: EffectContext): (() => void) => {
  const { store, cloud } = ctx
  let errored = false
  cloud.sync = startSync({
    local: () => store.getState().app,
    apply: fn => { store.dispatch(remoteApplied({ fn })) },
    onReady: () => { store.dispatch(readySet(true)) },
    onError: () => {
      if (errored) return
      errored = true
      store.dispatch(syncFailedSet(true))
      store.dispatch(toast('Synchronisation impossible : nouvelle tentative automatique, vos changements restent sur cet appareil', 'err'))
    },
    onRecovered: () => {
      errored = false
      store.dispatch(syncFailedSet(false))
      store.dispatch(toast('Synchronisation rétablie', 'ok'))
    },
  })
  return () => { cloud.sync?.stop(); cloud.sync = null }
}
