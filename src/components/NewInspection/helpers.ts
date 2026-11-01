import type { AppState } from '@/types'
import type { ConstatUi, NewInspectionModel } from './types'

/** Données d'affichage du formulaire de constat : listes du référentiel et libellé de la note de propreté. */
export const buildNewInspectionModel = (S: AppState, draft: ConstatUi): NewInspectionModel => ({
  draft,
  logements: S.logements.filter(l => l.typo !== 'BUR').map(l => ({ v: l.id, l: `${l.id} · ${l.typo} · ${l.ville}` })),
  contextes: S.ref.contextes,
  contexte: draft.contexte || S.ref.contextes[0],
  propreteLabel: draft.proprete == null ? '—' : draft.proprete + ' · ' + S.ref.proprete[draft.proprete].toLowerCase(),
  groupes: Object.entries(S.ref.signalements),
})
