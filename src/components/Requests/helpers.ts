import type { AppState, Demande, Logement } from '@/types'
import { CLOSED, STAT, URG, ageOf, circuitLabel, circuitOf, etabOf, getLog, nbPhotos, profilOf, uniqueEtabs } from '@/helpers/domain'
import { TODAY, fdy } from '@/helpers/dates'
import { statInfo } from '@/components/StatusChip/helpers'
import { PER_PAGE, TABS } from './constants'
import type { DemUi, RequestFilter, RequestsModel } from './types'

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

/** Demandes correspondant à l'onglet, à la recherche et aux filtres. */
export const filterDemandes = (S: AppState, all: Demande[], ui: DemUi): Demande[] => {
  const tabFn = (TABS.find(t => t[0] === ui.tab) || TABS[1])[2]
  const q = ui.q.trim().toLowerCase()
  return all.filter(tabFn).filter(d => {
    const log = getLog(S, d.logementId)
    if (q && !`${d.id} ${log?.id} ${log?.adresse} ${log?.ville} ${d.lignes.map(l => l.nature + ' ' + l.lot + ' ' + l.piece).join(' ')}`.toLowerCase().includes(q)) return false
    if (ui.etab && log?.etab !== ui.etab) return false
    if (ui.dept && log?.dept !== ui.dept) return false
    if (ui.lot && !d.lignes.some(l => l.lot === ui.lot)) return false
    if (ui.urgence && d.urgence !== ui.urgence) return false
    if (ui.circuit && !d.lignes.some(l => l.circuit === ui.circuit)) return false
    if (ui.statut && d.statut !== ui.statut) return false
    return true
  }).sort((a, b) => b.recueLe.localeCompare(a.recueLe))
}

/** Modèle d'affichage de l'écran Demandes. */
export const buildRequestsModel = (S: AppState, ui: DemUi): RequestsModel => {
  const all = visibleDemandes(S)
  const filtered = filterDemandes(S, all, ui)
  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const page = Math.min(ui.page, pages - 1)
  const month = TODAY.slice(0, 7)
  const filters: RequestFilter[] = [
    ...(S.profil !== 'etab' ? [{ key: 'etab' as const, label: 'Établissement', options: uniqueEtabs(S) }] : []),
    { key: 'dept', label: 'Département', options: [{ v: '77', l: '77 · Seine-et-Marne' }, { v: '91', l: '91 · Essonne' }] },
    { key: 'lot', label: 'Lot', options: Object.keys(S.ref.lots) },
    { key: 'urgence', label: 'Urgence', options: S.ref.urgences.map(u => ({ v: u.k, l: u.l })) },
    { key: 'circuit', label: 'Circuit', options: S.ref.circuits.map(c => ({ v: c.k, l: c.l })) },
    { key: 'statut', label: 'Statut', options: Object.entries(STAT).map(([k, v]) => ({ v: k, l: v[0] })) },
  ]
  return {
    subtitle: S.profil === 'etab' ? 'Les demandes de votre établissement.' : 'Toutes les demandes, tous circuits. Les établissements ne voient que les leurs.',
    tabs: TABS.map(([key, label, test]) => {
      const n = all.filter(test).length
      return { key, label, badge: key !== 'cloturees' ? n : undefined, badgeClassName: key === 'a_reactualiser' && n ? '!bg-violet-soft !text-violet' : '' }
    }),
    filters,
    hasFilter: (['etab', 'dept', 'lot', 'urgence', 'circuit', 'statut', 'q'] as const).some(k => ui[k]),
    filtered,
    shown: filtered.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE).map(d => ({
      d,
      log: getLog(S, d.logementId),
      action: actionFor(d),
      age: ageOf(d),
      closed: CLOSED.includes(d.statut),
      reactualiser: d.statut === 'a_reactualiser',
      circuit: circuitOf(S, d),
      status: statInfo(S, d),
      urgence: d.urgence && URG[d.urgence] ? [URG[d.urgence][0], URG[d.urgence][1]] : null,
      photos: nbPhotos(d),
    })),
    page,
    pages,
    reactualiser: all.filter(d => d.statut === 'a_reactualiser').length,
    horsProcedure: all.filter(d => ['mail', 'tel'].includes(d.origine) && d.recueLe.startsWith(month)).length,
  }
}

/** Lignes de l'export CSV (une par ligne de demande, entête comprise). */
export const buildCsvData = (S: AppState, rows: Demande[]): unknown[][] => {
  const data: unknown[][] = [['N° demande', 'Reçue le', 'Établissement', 'Logement', 'Ville', 'Ligne', 'Pièce', 'Lot', 'Nature', 'Description', 'Urgence', 'Circuit', 'Imputation', 'Statut', 'Ancienneté (j)']]
  rows.forEach(d => {
    const log = getLog(S, d.logementId)
    d.lignes.forEach((l, i) => data.push([d.id, fdy(d.recueLe), log?.etab, log?.id, log?.ville, i + 1, l.piece, l.lot, l.nature, l.description, (URG[d.urgence] || [''])[0], circuitLabel(S, l.circuit), l.imputation, STAT[d.statut][0], ageOf(d)]))
  })
  return data
}
