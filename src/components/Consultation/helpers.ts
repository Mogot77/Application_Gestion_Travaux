import type { AppState, Consultation as Cs, Demande } from '@/types'
import { getLog } from '@/helpers/domain'
import { TODAY, addDays } from '@/helpers/dates'

/** Brouillon de consultation d'une demande (créé à la première ouverture). */
export const newDraft = (S: AppState, d: Demande): Cs => {
  const lots = [...new Set(d.lignes.map(l => l.lot))]
  const log = getLog(S, d.logementId)
  const ents = S.entreprises.filter(e => e.lots.some(l => lots.includes(l)))
  const near = ents.filter(e => e.secteur === log?.secteur || e.secteur.slice(0, 2) === log?.dept)
  return {
    id: 'BR-' + d.id, demandeId: d.id, statut: 'brouillon', mode: 'devis', lignes: d.lignes.map((_l, i) => i),
    descriptif: '', entreprises: (near.length ? near : ents).slice(0, 4).map(e => e.id),
    dateLimite: addDays(TODAY, 14), heureLimite: '12:00', visite: true,
    creneaux: [addDays(TODAY, 5) + 'T09:00', addDays(TODAY, 6) + 'T14:00', addDays(TODAY, 7) + 'T10:00'],
    delai: 'Sous 3 semaines après commande', criteres: { prix: 60, delai: 25, qualite: 15 }, estimation: '',
    message: 'Bonjour, merci de nous transmettre votre devis détaillé avant la date limite.', motifUnique: '',
    reponses: {}, questions: [], historique: [], decision: null,
  }
}
export const draftOf = (S: AppState, demandeId: string) => S.consultations.find(x => x.demandeId === demandeId && x.statut === 'brouillon')
