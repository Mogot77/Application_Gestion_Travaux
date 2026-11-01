import Chip from '@/components/ui/Chip'
import Kv from '@/components/ui/Kv'
import Note from '@/components/ui/Note'
import { fday, fdur, toMin, toTime } from '@/helpers/dates'
import type { AppointmentPanelViewProps } from './types'

/** Vue pure du panneau « rendez-vous » (consultation, déplacement, annulation). */
const AppointmentPanelView = ({ model, onMove, onCancel }: AppointmentPanelViewProps) => {
  const { r, ouvrierNom, demandeId, logement, travaux, etat: [el, ec] } = model
  return (
    <>
      <div className="small muted font-bold tracking-[.05em]">RENDEZ-VOUS</div>
      <div className="row between"><strong className="text-base">{demandeId ? <a href={`#/demande/${demandeId}`}>{demandeId}</a> : r.label}</strong><Chip tone={ec}>{el}</Chip></div>
      <Kv pairs={[
        ['Ouvrier', ouvrierNom], ['Date', fday(r.date)], ['Horaire', `${r.debut} – ${toTime(toMin(r.debut) + r.duree)}`],
        ['Logement', logement], ['Travaux', travaux],
      ]} />
      {r.motifImp && <Note tone="warn">Report nécessaire : {r.motifImp}</Note>}
      {r.rapport && <Note>Temps passé {fdur(r.rapport.tempsMin)} · {r.rapport.conso.length} consommable(s)</Note>}
      <div className="row !gap-2">
        {demandeId && <a className="btn btn-sm" href={`#/fiche/${demandeId}`}>{r.rapport ? 'Rapport' : 'Fiche'}</a>}
        {demandeId && r.etat === 'planned' && <button className="btn btn-sm" onClick={onMove}>Déplacer</button>}
        {r.etat === 'planned' && <button className="btn btn-sm btnd" onClick={onCancel}>Annuler</button>}
      </div>
    </>
  )
}

export default AppointmentPanelView
