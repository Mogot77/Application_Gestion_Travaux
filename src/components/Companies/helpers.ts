import type { AppState, Entreprise } from '@/types'
import { TODAY, diffDays } from '@/helpers/dates'
import { entDocs, getD, getLog, shortLot } from '@/helpers/domain'
import type { CompaniesModel, CompaniesUi, CompanyRow, EntStats, Invitation, InvitationRow } from './types'

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

/** Modèle d'affichage : entreprises filtrées (recherche + filtre), avec leurs consultations. */
export const buildCompaniesModel = (S: AppState, ui: CompaniesUi): CompaniesModel => {
  const q = ui.q.toLowerCase()
  const rows = S.entreprises
    .map(e => ({ e, st: statsOf(S, e) }))
    .filter(({ e, st }) => (!q || `${e.nom} ${e.ville} ${e.activite}`.toLowerCase().includes(q))
      && (!ui.f || (ui.f === 'attente' && st.attente > 0) || (ui.f === 'recu' && st.recus > 0) || (ui.f === 'docs' && !st.docsOk)))
    .map(({ e, st }): CompanyRow => ({
      e, attente: st.attente, recus: st.recus, retenus: st.retenus, docsOk: st.docsOk,
      invitations: st.invitations.map(({ cs, rep, closed }): InvitationRow => {
        const d = getD(S, cs.demandeId)
        const log = getLog(S, d?.logementId)
        const lots = d ? cs.lignes.map(i => shortLot(d.lignes[i]?.lot)).filter((v, i, a) => v && a.indexOf(v) === i).join(' et ') : '—'
        return { id: cs.id, lots, ville: log?.ville, dateLimite: cs.dateLimite, heureLimite: cs.heureLimite, rep, closed }
      }),
    }))
  const totalAttente = S.entreprises.reduce((n, e) => n + statsOf(S, e).attente, 0)
  return { total: S.entreprises.length, totalAttente, rows }
}
