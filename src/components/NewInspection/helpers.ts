import type { AppState } from '@/types'
import { ECHELONS, SUITES, recidive, scenarios, suggestions } from '@/helpers/constatSuites'
import { ROLES } from '@/helpers/roles'
import type { ConstatUi, NewInspectionModel } from './types'

/** Données d'affichage du formulaire de constat : listes du référentiel, note de propreté, scénarios et suites conseillées. */
export const buildNewInspectionModel = (S: AppState, draft: ConstatUi): NewInspectionModel => {
  const sc = scenarios(draft, draft.logementId ? recidive(S, draft.logementId) : false)
  return {
    draft,
    logements: S.logements.filter(l => l.typo !== 'BUR').map(l => ({ v: l.id, l: `${l.id} · ${l.typo} · ${l.ville}` })),
    contextes: S.ref.contextes,
    contexte: draft.contexte || S.ref.contextes[0],
    propreteLabel: draft.proprete == null ? '—' : draft.proprete + ' · ' + S.ref.proprete[draft.proprete].toLowerCase(),
    groupes: Object.entries(S.ref.signalements),
    scenarios: sc,
    conseil: suggestions(sc),
    suites: SUITES,
    echelons: ECHELONS.map(role => ({ role, label: ROLES[role].label })),
  }
}
