import type { AppState, Demande, Logement } from '@/types'
import { etabOf, profilOf } from '@/helpers/domain'

/** Libellé et lien de l'action principale d'une demande selon son statut. */
export const actionFor = (d: Demande): [string, string] => {
  switch (d.statut) {
    case 'a_qualifier': case 'en_qualification': return ['Qualifier', `#/demande/${d.id}`]
    case 'a_valider_occupant': return ['Valider', `#/demande/${d.id}`]
    case 'a_planifier': return ['Planifier', `#/planning?sel=${d.id}`]
    case 'acces_impossible': return ['Reprogrammer', `#/planning?sel=${d.id}`]
    case 'a_reactualiser': return ['Relancer', `#/demande/${d.id}`]
    case 'consultation': return ['Devis', `#/devis/${d.consultationId}`]
    case 'realisee': case 'cloturee': return ['Rapport', `#/fiche/${d.id}`]
    default: return ['Ouvrir', `#/demande/${d.id}`]
  }
}

export const logShort = (l?: Logement) => l ? `${l.id} · ${l.typo === 'BUR' ? 'Bureaux' : l.typo}` : ''

export const visibleDemandes = (S: AppState) => {
  let list = S.demandes.filter(d => d.statut !== 'brouillon')
  if (S.profil === 'etab') list = list.filter(d => etabOf(S, d) === profilOf(S).etab)
  if (S.moi?.portee === 'siennes') list = list.filter(d => !!d.auteurEmail && d.auteurEmail === S.moi?.email)
  return list
}
