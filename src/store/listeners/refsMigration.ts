/* MIGRATIONS PONCTUELLES des référentiels, écrites dans Firestore (ref/main) au premier chargement d'un compte :
   - villes (coordonnées de repli) et départements, auparavant dans le code ;
   - signalement « Drogues (interdit) » ajouté au groupe « Usage du logement ».
   Une fois passées en production, ce fichier (et store/queries/legacyRefs.ts) peut être supprimé. */
import { mutated, readySet } from '@/store/reducers'
import { LEGACY_DEPTS, LEGACY_VILLES } from '@/store/queries/legacyRefs'
import type { EffectContext } from './types'

const DROGUES = 'Drogues (interdit)'
const GROUPE = 'Usage du logement'

export const refsMigrationEffect = ({ store, listener }: EffectContext): (() => void) => {
  const migrate = () => {
    const { ref } = store.getState().app
    if (!(ref.refsMigrated || Object.keys(ref.villes ?? {}).length || Object.keys(ref.depts ?? {}).length)) {
      store.dispatch(mutated({ fn: s => { s.ref.villes = structuredClone(LEGACY_VILLES); s.ref.depts = { ...LEGACY_DEPTS }; s.ref.refsMigrated = true }, now: true }))
    }
    // Ne s'exécute qu'une fois les référentiels chargés (groupes présents) ; le drapeau évite de recréer une valeur supprimée ensuite.
    if (!ref.constatDefaults && Object.keys(ref.signalements ?? {}).length) {
      store.dispatch(mutated({
        fn: s => {
          const g = s.ref.signalements[GROUPE] ?? (s.ref.signalements[GROUPE] = [])
          if (!g.includes(DROGUES)) g.push(DROGUES)
          s.ref.constatDefaults = true
        },
        now: true,
      }))
    }
  }
  return listener.startListening({ actionCreator: readySet, effect: a => { if (a.payload) migrate() } })
}
