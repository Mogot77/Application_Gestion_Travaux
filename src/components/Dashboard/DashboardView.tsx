import Opts from '@/components/ui/Opts'
import type { OptItem } from '@/components/ui/Opts'
import Button from '@/components/ui/Button'
import Empty from '@/components/ui/Empty'
import Kpi from '@/components/ui/Kpi'
import FilterSelect from '@/components/ui/FilterSelect'
import { fdur, fmonth, fnum } from '@/helpers/dates'
import { MOIS_C } from './constants'
import { fj } from './helpers'
import type { DashboardViewProps } from './types'

/** Tableau de bord travaux (présentation seule) : indicateurs, graphiques et tableau par établissement. */
const DashboardView = ({ ui, model, onChange, onExport }: DashboardViewProps) => {
  const { months, etabOptions, moisCount, urg, delST, delUrg, reportedCount, in48, heures, imp, refac, hors, lotTitle, lotRows, maxLot, last6, vol, maxV, circ, maxC, etabs } = model

  const fsel = (k: 'dept' | 'etab', label: string, opts: OptItem[]) => (
    <FilterSelect value={ui[k]} onChange={v => onChange({ [k]: v })} label={label} options={opts} />
  )

  return (
    <>
      <div className="pagehead">
        <h1>Tableau de bord travaux</h1>
        <div className="row !gap-2">
          <select className="flt" value={ui.mois} onChange={e => onChange({ mois: e.target.value })}><Opts list={months} /></select>
          {fsel('dept', 'Tous départements', [{ v: '77', l: '77 · Seine-et-Marne' }, { v: '91', l: '91 · Essonne' }])}
          {fsel('etab', 'Tous établissements', etabOptions)}
          <Button onClick={onExport}>Exporter</Button>
        </div>
      </div>
      <div className="kpis">
        <Kpi label="Demandes reçues" value={moisCount} sub={<>dont {urg} urgente{urg > 1 ? 's' : ''}</>} />
        <Kpi label="Délai demande → intervention ST" value={fj(delST)} sub={<>urgentes : {fj(delUrg)}</>} />
        <Kpi label="Rapports saisis sous 48 h" value={reportedCount ? Math.round(in48 / reportedCount * 100) + ' %' : '—'} sub={<>objectif 95 % · {reportedCount} rapport(s)</>} />
        <Kpi label="Heures ST réalisées" value={fdur(heures)} sub={<>coût : [taux horaire à définir] · {imp} accès impossible{imp > 1 ? 's' : ''}</>} />
        <Kpi label="Refacturable aux usagers" value={refac} sub={<>ligne{refac > 1 ? 's' : ''} imputée{refac > 1 ? 's' : ''} à l'usager</>} />
        <Kpi label="Demandes hors procédure" value={hors} valueClassName={hors ? 'text-warn' : 'text-ink'} sub="mail ou téléphone" />
      </div>
      <div className="cols mb-4 !gap-4">
        <section className="card pad" style={{ flex: '1 1 520px' }}>
          <h2 className="h2s">{lotTitle}</h2>
          {lotRows.map(([k, n]) => <div key={k} className="hb"><span>{k}</span><div className="tr"><span style={{ width: `${Math.round(n / maxLot * 100)}%` }}></span></div><b>{n}</b></div>)}
          {!lotRows.length && <Empty>Aucune demande sur la période</Empty>}
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
    </>
  )
}

export default DashboardView
