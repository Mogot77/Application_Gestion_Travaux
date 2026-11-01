import type { Demande } from '../../types'
import { useApp } from '../../hooks/useApp'
import { useUiState } from '../../store/ui'
import { Layout } from '../layout/Layout'
import { Opts, type OptItem } from '../ui/Fields'
import { STAT, URG, circuitOf, etabOf, getD, getLog, shortLot, uniqueEtabs } from '../../lib/domain'
import { MOIS_C, TODAY, diffDays, fdur, fdy, fmonth, fnum, pad } from '../../lib/dates'
import { csv, download } from '../../lib/csv'

interface TbUi { mois: string; dept: string; etab: string }
const INIT: TbUi = { mois: TODAY.slice(0, 7), dept: '', etab: '' }

const avg = (arr: number[]) => arr.length ? arr.reduce((s, x) => s + x, 0) / arr.length : null
const fj = (n: number | null) => n == null ? '—' : fnum(n, 1) + ' j'

export function Tableau() {
  const { S } = useApp()
  const [ui, setUi] = useUiState<TbUi>('tb', INIT)

  const interDate = (d: Demande) => {
    const r = S.rdvs.filter(x => x.demandeId === d.id && (x.etat === 'done' || x.etat === 'running')).sort((a, b) => a.date.localeCompare(b.date))[0]
    return r ? r.date : (d.dateIntervention && d.dateIntervention <= TODAY ? d.dateIntervention : '')
  }
  const months = [...new Set([TODAY.slice(0, 7), ...S.demandes.map(d => d.recueLe.slice(0, 7))])].sort().reverse()
  const inScope = (d: Demande) => { const l = getLog(S, d.logementId); return d.statut !== 'brouillon' && (!ui.dept || l?.dept === ui.dept) && (!ui.etab || l?.etab === ui.etab) }
  const scope = S.demandes.filter(inScope)
  const mois = scope.filter(d => d.recueLe.startsWith(ui.mois))
  const urg = mois.filter(d => d.urgence === 'urgent').length
  const withDelay = scope.map(d => ({ d, j: interDate(d) ? diffDays(d.recueLe, interDate(d)) : null })).filter((x): x is { d: Demande; j: number } => x.j != null && x.j >= 0)
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

  const etabs = uniqueEtabs(S).map(e => {
    const ds = scope.filter(d => etabOf(S, d) === e && d.recueLe.startsWith(ui.mois))
    const renv = ds.filter(d => d.historique.some(h => h.t.startsWith('Renvoyée'))).length
    const supp = ds.filter(d => d.origine === 'supp').length + S.rdvs.filter(r => { const d = getD(S, r.demandeId); return r.rapport && d && etabOf(S, d) === e && r.date.startsWith(ui.mois) }).reduce((s, r) => s + (r.rapport?.supps || []).length, 0)
    const dl = avg(withDelay.filter(x => etabOf(S, x.d) === e).map(x => x.j))
    return [e, ds.length, renv, supp, dl] as const
  }).filter(r => r[1] || r[4] != null)

  const fsel = (k: 'dept' | 'etab', label: string, opts: OptItem[]) => (
    <select className={`flt${ui[k] ? ' on' : ''}`} value={ui[k]} onChange={e => setUi({ [k]: e.target.value })}><Opts list={opts} placeholder={label} /></select>
  )
  const exportCsv = () => {
    const rows: unknown[][] = [['N° demande', 'Reçue le', 'Établissement', 'Département', 'Urgence', 'Circuit', 'Statut', 'Date intervention', 'Délai (j)', 'Lignes', 'Lots']]
    S.demandes.filter(d => d.recueLe.startsWith(ui.mois) && d.statut !== 'brouillon').forEach(d => {
      const l = getLog(S, d.logementId); const di = interDate(d)
      rows.push([d.id, fdy(d.recueLe), l?.etab, l?.dept, URG[d.urgence][0], circuitOf(S, d), STAT[d.statut][0], di ? fdy(di) : '', di ? diffDays(d.recueLe, di) : '', d.lignes.length, d.lignes.map(x => x.lot).join(', ')])
    })
    download(`tableau-de-bord_${ui.mois}.csv`, csv(rows))
  }

  return (
    <Layout active="tableau">
      <div className="pagehead">
        <h1>Tableau de bord travaux</h1>
        <div className="row !gap-2">
          <select className="flt" value={ui.mois} onChange={e => setUi({ mois: e.target.value })}><Opts list={months.map(m => ({ v: m, l: fmonth(m) }))} /></select>
          {fsel('dept', 'Tous départements', [{ v: '77', l: '77 · Seine-et-Marne' }, { v: '91', l: '91 · Essonne' }])}
          {fsel('etab', 'Tous établissements', uniqueEtabs(S))}
          <button className="btn" onClick={exportCsv}>Exporter</button>
        </div>
      </div>
      <div className="kpis">
        <div className="card kpi"><div className="l">Demandes reçues</div><div className="v">{mois.length}</div><div className="s">dont {urg} urgente{urg > 1 ? 's' : ''}</div></div>
        <div className="card kpi"><div className="l">Délai demande → intervention ST</div><div className="v">{fj(delST)}</div><div className="s">urgentes : {fj(delUrg)}</div></div>
        <div className="card kpi"><div className="l">Rapports saisis sous 48 h</div><div className="v">{reported.length ? Math.round(in48 / reported.length * 100) + ' %' : '—'}</div><div className="s">objectif 95 % · {reported.length} rapport(s)</div></div>
        <div className="card kpi"><div className="l">Heures ST réalisées</div><div className="v">{fdur(heures)}</div><div className="s">coût : [taux horaire à définir] · {imp} accès impossible{imp > 1 ? 's' : ''}</div></div>
        <div className="card kpi"><div className="l">Refacturable aux usagers</div><div className="v">{refac}</div><div className="s">ligne{refac > 1 ? 's' : ''} imputée{refac > 1 ? 's' : ''} à l'usager</div></div>
        <div className="card kpi"><div className="l">Demandes hors procédure</div><div className={`v ${hors ? 'text-warn' : 'text-ink'}`}>{hors}</div><div className="s">mail ou téléphone</div></div>
      </div>
      <div className="cols mb-4 !gap-4">
        <section className="card pad" style={{ flex: '1 1 520px' }}>
          <h2 className="h2s">{lotTitle}</h2>
          {lotRows.map(([k, n]) => <div key={k} className="hb"><span>{k}</span><div className="tr"><span style={{ width: `${Math.round(n / maxLot * 100)}%` }}></span></div><b>{n}</b></div>)}
          {!lotRows.length && <div className="empty">Aucune demande sur la période</div>}
          <p className="muted small mb-0 mt-2">Nombre de lignes de demande par lot, {fmonth(ui.mois).toLowerCase()}.</p>
        </section>
        <section className="card pad" style={{ flex: '1 1 420px' }}>
          <h2 className="h2s">Demandes reçues par mois</h2>
          <div className="flex h-[180px] items-end gap-3.5 border-b border-field px-1.5">
            {vol.map((v, i) => (
              <div key={i} className="flex h-full flex-1 flex-col items-center justify-end text-xs font-semibold">{v}
                <span className={`mt-1 block w-full rounded-t-[3px] ${i === 5 ? 'bg-brand' : 'bg-bar'}`} style={{ height: `${Math.round(v / maxV * 86)}%` }}></span></div>
            ))}
          </div>
          <div className="flex gap-3.5 px-1.5 pt-1.5">{last6.map(ym => <span key={ym} className="flex-1 text-center text-xs text-muted">{MOIS_C[Number(ym.slice(5)) - 1]}</span>)}</div>
          {!ui.dept && !ui.etab && <p className="muted small mb-0 mt-2">Mois antérieurs : historique importé.</p>}
        </section>
      </div>
      <div className="cols !gap-4">
        <section className="card pad" style={{ flex: '1 1 420px' }}>
          <h2 className="h2s">Délai moyen par circuit (jours)</h2>
          {circ.map(([l, v]) => (
            <div key={l} className="hb !grid-cols-[150px_minmax(0,1fr)_50px]"><span>{l}</span><div className="tr"><span style={{ width: `${v == null ? 0 : Math.round(v / maxC * 100)}%` }}></span></div><b>{v == null ? '—' : fnum(v, 1)}</b></div>
          ))}
          <p className="muted small mb-0 mt-2">De la date de demande à la date d'intervention, toutes périodes.</p>
        </section>
        <section className="card pad tbl-wrap" style={{ flex: '1 1 520px' }}>
          <h2 className="h2s">Par établissement</h2>
          <table className="t"><thead><tr><th>Établissement</th><th>Demandes</th><th>Renvoyées</th><th>Ajouts sur place</th><th>Délai moyen</th></tr></thead><tbody>
            {etabs.map(r => <tr key={r[0]}><td>{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td><td>{r[3]}</td><td>{fj(r[4])}</td></tr>)}
            {!etabs.length && <tr><td colSpan={5} className="empty">—</td></tr>}
          </tbody></table>
        </section>
      </div>
    </Layout>
  )
}
