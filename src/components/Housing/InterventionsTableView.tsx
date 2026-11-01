import Chip from '@/components/ui/Chip'
import Empty from '@/components/ui/Empty'
import type { InterventionsTableViewProps } from './types'

/** Tableau des interventions d'un logement (présentation seule : les lignes sont préparées par le conteneur). */
const InterventionsTableView = ({ rows }: InterventionsTableViewProps) => {
  if (!rows.length) return <Empty>Aucune intervention</Empty>
  return (
    <div className="tbl-wrap"><table className="t"><thead><tr><th>Date</th><th>N°</th><th>Pièce · travaux</th><th>Circuit</th><th>Imputation</th><th>Statut</th><th>Rapport</th></tr></thead>
      <tbody>
        {rows.map(r => (
          <tr key={r.id}>
            <td>{r.date ? r.date : <>{r.requestDate} <small>demande</small></>}</td>
            <td><a href={`#/demande/${r.id}`}>{r.id}</a></td>
            <td>{r.pieces} · {r.natures}</td>
            <td>{r.circuit}</td>
            <td>{r.imputation}</td>
            <td><Chip tone={r.statusTone}>{r.statusLabel}</Chip></td>
            <td>{r.done ? <a href={`#/fiche/${r.id}`}>PDF</a> : <span className="muted">—</span>}</td>
          </tr>
        ))}
      </tbody></table></div>
  )
}

export default InterventionsTableView
