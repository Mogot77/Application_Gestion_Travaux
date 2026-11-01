import type { AppState, Demande } from '@/types'
import { fnum, TODAY, diffDays, fdy, fmonth, pad } from '@/helpers/dates'
import { STAT, URG, circuitOf, etabOf, getD, getLog, shortLot, uniqueEtabs } from '@/helpers/domain'
import type { DashboardModel, EtabRow, TbUi } from './types'

export const avg = (arr: number[]): number | null => arr.length ? arr.reduce((s, x) => s + x, 0) / arr.length : null

export const fj = (n: number | null): string => n == null ? '—' : fnum(n, 1) + ' j'

/** Date de première intervention réalisée ou en cours d'une demande ('' si aucune). */
export const interDate = (S: AppState, d: Demande): string => {
  const r = S.rdvs.filter(x => x.demandeId === d.id && (x.etat === 'done' || x.etat === 'running')).sort((a, b) => a.date.localeCompare(b.date))[0]
  return r ? r.date : (d.dateIntervention && d.dateIntervention <= TODAY ? d.dateIntervention : '')
}

/** Calcule tous les indicateurs du tableau de bord pour l'état et le filtre donnés. */
export const buildDashboardModel = (S: AppState, ui: TbUi): DashboardModel => {
  const months = [...new Set([TODAY.slice(0, 7), ...S.demandes.map(d => d.recueLe.slice(0, 7))])].sort().reverse()
  const inScope = (d: Demande) => { const l = getLog(S, d.logementId); return d.statut !== 'brouillon' && (!ui.dept || l?.dept === ui.dept) && (!ui.etab || l?.etab === ui.etab) }
  const scope = S.demandes.filter(inScope)
  const mois = scope.filter(d => d.recueLe.startsWith(ui.mois))
  const urg = mois.filter(d => d.urgence === 'urgent').length
  const withDelay = scope.map(d => ({ d, j: interDate(S, d) ? diffDays(d.recueLe, interDate(S, d)) : null })).filter((x): x is { d: Demande; j: number } => x.j != null && x.j >= 0)
  const delST = avg(withDelay.filter(x => x.d.lignes.some(l => l.circuit === 'ST')).map(x => x.j))
  const delUrg = avg(withDelay.filter(x => x.d.urgence === 'urgent' && x.d.lignes.some(l => l.circuit === 'ST')).map(x => x.j))
  const rdvMois = S.rdvs.filter(r => { const d = getD(S, r.demandeId); return r.date.startsWith(ui.mois) && !!d && inScope(d) })
  const reported = rdvMois.filter(r => r.rapport)
  const in48 = reported.filter(r => !r.finReel || diffDays(r.date, r.finReel.slice(0, 10)) <= 2).length
  const heures = rdvMois.filter(r => r.etat === 'done').reduce((s, r) => s + (r.rapport ? r.rapport.tempsMin : r.duree), 0)
  const imp = S.rdvs.filter(r => r.date.startsWith(ui.mois) && r.etat === 'imp').length
  const refac = mois.flatMap(d => d.lignes).filter(l => l.imputation === 'Usager (refacturation)').length
  const hors = mois.filter(d => ['mail', 'tel'].includes(d.origine)).length

  const lots: Record<string, number> = {}
  mois.forEach(d => d.lignes.forEach(l => { lots[l.lot] = (lots[l.lot] || 0) + 1 }))
  const lotRows = Object.entries(lots).sort((a, b) => b[1] - a[1])
  const maxLot = lotRows.length ? lotRows[0][1] : 1
  const top2 = lotRows.slice(0, 2).reduce((s, x) => s + x[1], 0), totLines = lotRows.reduce((s, x) => s + x[1], 0)
  const lotTitle = lotRows.length >= 2 ? `${shortLot(lotRows[0][0])} et ${shortLot(lotRows[1][0]).toLowerCase()} concentrent ${Math.round(top2 / totLines * 100)} % des lignes de demande` : 'Lignes de demande par lot'

  const last6: string[] = []
  { let [y, m] = ui.mois.split('-').map(Number); for (let i = 0; i < 6; i++) { last6.unshift(`${y}-${pad(m)}`); m--; if (!m) { m = 12; y-- } } }
  const vol = last6.map(ym => { const n = scope.filter(d => d.recueLe.startsWith(ym)).length; const h = ui.dept || ui.etab ? 0 : (S.histoMois[ym] || 0); return Math.max(n, h) })
  const maxV = Math.max(...vol, 1)

  const circ: [string, number | null][] = [['ST', 'Service technique'], ['prestataire', 'Prestataire'], ['bailleur', 'Bailleur']]
    .map(([k, l]) => [l, avg(withDelay.filter(x => x.d.lignes[0].circuit === k).map(x => x.j))])
  const maxC = Math.max(...circ.map(c => c[1] || 0), 1)

  const etabs: EtabRow[] = uniqueEtabs(S).map((e): EtabRow => {
    const ds = scope.filter(d => etabOf(S, d) === e && d.recueLe.startsWith(ui.mois))
    const renv = ds.filter(d => d.historique.some(h => h.t.startsWith('Renvoyée'))).length
    const supp = ds.filter(d => d.origine === 'supp').length + S.rdvs.filter(r => { const d = getD(S, r.demandeId); return r.rapport && d && etabOf(S, d) === e && r.date.startsWith(ui.mois) }).reduce((s, r) => s + (r.rapport?.supps || []).length, 0)
    const dl = avg(withDelay.filter(x => etabOf(S, x.d) === e).map(x => x.j))
    return [e, ds.length, renv, supp, dl]
  }).filter(r => r[1] || r[4] != null)

  return {
    months: months.map(m => ({ v: m, l: fmonth(m) })), etabOptions: uniqueEtabs(S), moisCount: mois.length, urg, delST, delUrg,
    reportedCount: reported.length, in48, heures, imp, refac, hors, lotTitle, lotRows, maxLot, last6, vol, maxV, circ, maxC, etabs,
  }
}

/** Lignes du CSV exporté (en-tête inclus) pour le mois filtré. */
export const buildDashboardCsvRows = (S: AppState, ui: TbUi): unknown[][] => {
  const rows: unknown[][] = [['N° demande', 'Reçue le', 'Établissement', 'Département', 'Urgence', 'Circuit', 'Statut', 'Date intervention', 'Délai (j)', 'Lignes', 'Lots']]
  S.demandes.filter(d => d.recueLe.startsWith(ui.mois) && d.statut !== 'brouillon').forEach(d => {
    const l = getLog(S, d.logementId); const di = interDate(S, d)
    rows.push([d.id, fdy(d.recueLe), l?.etab, l?.dept, URG[d.urgence][0], circuitOf(S, d), STAT[d.statut][0], di ? fdy(di) : '', di ? diffDays(d.recueLe, di) : '', d.lignes.length, d.lignes.map(x => x.lot).join(', ')])
  })
  return rows
}
