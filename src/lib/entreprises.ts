import type { AppState, Consultation, Entreprise, ReponseDevis } from '../types'
import { TODAY, diffDays } from './dates'
import { entDocs } from './domain'

export interface Invitation { cs: Consultation; rep: ReponseDevis; closed: boolean }

export interface EntStats { invitations: Invitation[]; recus: number; attente: number; declines: number; retenus: number; docsOk: boolean }

/** Consultations envoyées auxquelles l'entreprise est invitée, avec sa réponse. */
export const invitationsOf = (S: AppState, e: Entreprise): Invitation[] =>
  S.consultations
    .filter(c => c.statut !== 'brouillon' && c.entreprises.includes(e.id))
    .map(cs => ({
      cs,
      rep: cs.reponses[e.id] || { statut: 'attente' as const },
      closed: cs.statut === 'commande' || diffDays(cs.dateLimite, TODAY) > 0,
    }))

export const statsOf = (S: AppState, e: Entreprise): EntStats => {
  const invitations = invitationsOf(S, e)
  return {
    invitations,
    recus: invitations.filter(i => i.rep.statut === 'recu').length,
    attente: invitations.filter(i => i.rep.statut === 'attente' && !i.closed).length,
    declines: invitations.filter(i => i.rep.statut === 'decline').length,
    retenus: invitations.filter(i => i.cs.decision?.entrepriseId === e.id).length,
    docsOk: entDocs(e).ok,
  }
}
