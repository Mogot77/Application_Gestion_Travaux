import StatusChip from '@/components/StatusChip'
import Empty from '@/components/ui/Empty'
import { useApp } from '@/hooks/useApp'
import { circuitOf, nextRdv } from '@/helpers/domain'
import { TODAY, fd } from '@/helpers/dates'
import type { Demande } from '@/types'
import type { InterventionsTableProps } from './types'

const InterventionsTable = ({ ds }: InterventionsTableProps) => {
  const { S } = useApp()
  if (!ds.length) return <Empty>Aucune intervention</Empty>
  const interDate = (d: Demande) => { const r = nextRdv(S, d); return r ? r.date : d.dateIntervention || '' }
  return (
    <div className="tbl-wrap"><table className="t"><thead><tr><th>Date</th><th>N°</th><th>Pièce · travaux</th><th>Circuit</th><th>Imputation</th><th>Statut</th><th>Rapport</th></tr></thead>
      <tbody>
        {ds.map(d => {
          const di = interDate(d)
          const done = ['realisee', 'cloturee'].includes(d.statut)
          return (
            <tr key={d.id}>
              <td>{di ? fd(di) + (di > TODAY || d.statut === 'planifiee' ? ' (prévue)' : '') : <>{fd(d.recueLe)} <small>demande</small></>}</td>
              <td><a href={`#/demande/${d.id}`}>{d.id}</a></td>
              <td>{d.lignes.map(l => l.piece).filter((v, i, a) => a.indexOf(v) === i).join(', ')} · {d.lignes.map(l => l.nature).join(', ')}</td>
              <td>{circuitOf(S, d) || '—'}</td>
              <td>{[...new Set(d.lignes.map(l => l.imputation.replace(' (refacturation)', '')))].join(' / ')}</td>
              <td><StatusChip d={d} /></td>
              <td>{done ? <a href={`#/fiche/${d.id}`}>PDF</a> : <span className="muted">—</span>}</td>
            </tr>
          )
        })}
      </tbody></table></div>
  )
}

export default InterventionsTable
