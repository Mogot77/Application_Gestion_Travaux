import type { AppState, Demande } from '@/types'
import { CLOSED, QUALIF, RDV_ETAT, URG, ageOf, circuitLabel, getD, getLog, getOuv, nextRdv } from '@/helpers/domain'
import { TODAY, diffDays } from '@/helpers/dates'
import { statInfo } from '@/components/StatusChip/helpers'
import type { QualifAction, QualifBarItem, QualificationModel, QualifReportRow } from './types'

/** Barre d'actions de l'en-tête selon le statut de la demande et le profil. */
export const buildBar = (S: AppState, d: Demande, isEtab: boolean): QualifBarItem[] => {
  const btn = (key: string, label: string, action: QualifAction, className = 'btn', wrap = true): QualifBarItem => ({ key, label, className, action, wrap })
  const lnk = (key: string, label: string, href: string, className = 'btn', wrap = true): QualifBarItem => ({ key, label, className, href, wrap })
  if (isEtab) {
    if (d.statut === 'a_completer') return [btn('', "J'ai complété la demande", 'completee', 'btn btnp', false)]
    if (d.statut === 'a_reactualiser') return [btn('', "Confirmer : le besoin est toujours d'actualité", 'reactualisee', 'btn btnp', false)]
    return d.ft ? [lnk('', 'Fiche imprimable', `#/fiche/${d.id}`, 'btn', false)] : []
  }
  const B: QualifBarItem[] = []
  if (QUALIF.includes(d.statut)) {
    B.push(lnk('consult', 'Consulter des entreprises', d.consultationId ? `#/devis/${d.consultationId}` : `#/consultation/${d.id}`))
    B.push(btn('renv', "Renvoyer à l'établissement", 'renvoyer'))
    B.push(btn('rej', 'Rejeter', 'rejeter', 'btn btnd'))
    B.push(btn('val', d.statut === 'a_valider_occupant' ? 'Valider la demande occupant' : 'Valider et planifier', 'valider', 'btn btnp'))
  }
  if (d.statut === 'a_completer') { B.push(btn('comp', 'Marquer comme complétée', 'completee')); B.push(btn('rej2', 'Rejeter', 'rejeter', 'btn btnd')) }
  if (d.statut === 'a_reactualiser') { B.push(btn('rel', 'Relancer le demandeur', 'relancer')); B.push(btn('rea', 'Réactualisée', 'reactualisee')); B.push(btn('rej3', 'Rejeter', 'rejeter', 'btn btnd')) }
  if (['a_planifier', 'acces_impossible'].includes(d.statut)) {
    B.push(lnk('f1', 'Fiche imprimable', `#/fiche/${d.id}`))
    B.push(lnk('p1', d.statut === 'acces_impossible' ? 'Reprogrammer' : 'Planifier', `#/planning?sel=${d.id}`, 'btn btnp'))
  }
  if (['planifiee', 'en_cours'].includes(d.statut)) {
    B.push(lnk('f2', 'Fiche imprimable', `#/fiche/${d.id}`))
    B.push(lnk('p2', 'Voir au planning', `#/planning?sel=${d.id}&w=${nextRdv(S, d)?.date || ''}`))
  }
  if (d.statut === 'realisee') { B.push(lnk('r1', 'Rapport', `#/fiche/${d.id}`)); B.push(btn('r2', 'Réceptionner et clôturer', 'cloturer', 'btn btnp')) }
  if (d.statut === 'prestataire' && !d.consultationId) B.unshift(lnk('c0', 'Consulter des entreprises', `#/consultation/${d.id}`))
  if (d.statut === 'consultation' || (d.statut === 'prestataire' && d.consultationId)) B.push(lnk('dv', 'Devis et décision', `#/devis/${d.consultationId}`, 'btn btnp'))
  if (d.statut === 'prestataire') B.push(btn('pf', 'Intervention du prestataire réalisée', 'presteFait', 'btn btnp'))
  if (d.statut === 'bailleur') { B.push(btn('b1', 'Relancer le bailleur', 'relancerBailleur')); B.push(btn('b2', 'Travaux faits par le bailleur', 'bailleurFait', 'btn btnp')) }
  if (d.statut === 'sinistre') { B.push(btn('s1', "Déclaration envoyée à l'assureur", 'declaration')); B.push(btn('s2', 'Passer en travaux ST', 'sinistreTravaux', 'btn btnp')) }
  if (d.statut === 'cloturee') B.push(lnk('cl', 'Rapport', `#/fiche/${d.id}`))
  return B
}

/** Modèle d'affichage de la qualification ; `undefined` si la demande est introuvable. */
export const buildQualificationModel = (S: AppState, id: string): QualificationModel | undefined => {
  const d = getD(S, id)
  if (!d) return undefined
  const isEtab = S.profil === 'etab'
  const log = getLog(S, d.logementId)
  const rdvs = S.rdvs.filter(r => r.demandeId === d.id).sort((a, b) => (a.date + a.debut).localeCompare(b.date + b.debut))
  const autres = S.demandes.filter(x => x.logementId === log?.id && x.id !== d.id)
  const rapports: QualifReportRow[] = []
  rdvs.forEach(r => { if (r.rapport) rapports.push({ r, rp: r.rapport, ouvrier: getOuv(S, r.ouvrierId)?.nom }) })
  return {
    d, log, edit: QUALIF.includes(d.statut) && !isEtab, age: ageOf(d),
    urgence: d.urgence && URG[d.urgence] ? [URG[d.urgence][0], URG[d.urgence][1]] : null,
    status: statInfo(S, d),
    bar: buildBar(S, d, isEtab),
    totalST: d.lignes.filter(l => l.circuit === 'ST').reduce((s, l) => s + l.duree, 0),
    lines: d.lignes.map(l => {
      const circ = S.ref.circuits.find(c => c.k === l.circuit)
      return { l, circuitText: circuitLabel(S, l.circuit), circuitDesc: circ?.d }
    }),
    rapports,
    rdvs: rdvs.map(r => ({ r, ouvrier: getOuv(S, r.ouvrierId)?.nom, etat: RDV_ETAT[r.etat] })),
    lastC: S.constats.filter(c => c.logementId === log?.id).sort((a, b) => b.date.localeCompare(a.date))[0],
    ouvertes: autres.filter(x => !CLOSED.includes(x.statut)),
    n12: autres.filter(x => diffDays(x.recueLe, TODAY) <= 365).length,
    imputations: S.ref.imputations,
    circuitOptions: S.ref.circuits.map(c => ({ v: c.k, l: c.l })),
    urgenceOptions: S.ref.urgences.map(u => ({ v: u.k, l: u.l })),
  }
}
