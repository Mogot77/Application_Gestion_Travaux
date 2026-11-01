import type { AppState, Entreprise } from '@/types'
import { TODAY, diffDays } from '@/helpers/dates'
import { entDocs } from '@/helpers/domain'
import type { EntStats, Invitation } from './types'

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
