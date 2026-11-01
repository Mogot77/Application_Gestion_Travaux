import Button from '@/components/ui/Button'
import Pages from './Pages'
import type { JobSheetViewProps } from './types'

/** Fiches d'intervention imprimables (vue) : en-tête d'écran (non imprimé) + une paire recto / verso par demande. */
const JobSheetView = ({ sheets, onPrint }: JobSheetViewProps) => (
  <>
    <div className="pagehead noprint">
      <div><div className="crumb"><a href="#/demandes">Demandes</a> › Fiche{sheets.length > 1 ? 's' : ''} imprimable{sheets.length > 1 ? 's' : ''}</div><h1>{sheets.length === 1 ? sheets[0].d.id : `${sheets.length} fiches d'intervention`}</h1></div>
      <div className="row !gap-2">{sheets.length === 1 && <a className="btn" href={`#/demande/${sheets[0].d.id}`}>Ouvrir la demande</a>}<Button variant="primary" disabled={!sheets.length} onClick={onPrint}>Imprimer (recto / verso)</Button></div>
    </div>
    {sheets.length ? <div className="a4wrap">{sheets.map(m => <Pages key={m.d.id} m={m} />)}</div> : <div className="card pad empty">Aucune fiche à imprimer.</div>}
  </>
)

export default JobSheetView
