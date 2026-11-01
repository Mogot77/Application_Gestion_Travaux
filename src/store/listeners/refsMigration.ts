/* MIGRATION PONCTUELLE : les villes (coordonnées de repli) et les départements étaient dans le code.
   Au premier chargement d'un compte, on les écrit dans Firestore (ref/main) s'ils n'y sont pas encore.
   Une fois la migration passée en production, ce fichier (et store/queries/legacyRefs.ts) peut être supprimé. */
import { mutated, readySet } from '@/store/reducers'
import { LEGACY_DEPTS, LEGACY_VILLES } from '@/store/queries/legacyRefs'
import type { EffectContext } from './types'

export const refsMigrationEffect = ({ store, listener }: EffectContext): (() => void) => {
  const migrate = () => {
    const { ref } = store.getState().app
    if (ref.refsMigrated || Object.keys(ref.villes ?? {}).length || Object.keys(ref.depts ?? {}).length) return
    store.dispatch(mutated({ fn: s => { s.ref.villes = structuredClone(LEGACY_VILLES); s.ref.depts = { ...LEGACY_DEPTS }; s.ref.refsMigrated = true }, now: true }))
  }
  return listener.startListening({ actionCreator: readySet, effect: a => { if (a.payload) migrate() } })
}
