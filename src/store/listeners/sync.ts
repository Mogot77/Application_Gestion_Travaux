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
      store.dispatch(toast('Synchronisation impossible : vos changements ne sont pas enregistrés en ligne', 'err'))
    },
  })
  return () => { cloud.sync?.stop(); cloud.sync = null }
}
