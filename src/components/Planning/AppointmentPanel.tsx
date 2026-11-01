import { useApp } from '@/hooks/useApp'
import Chip from '@/components/ui/Chip'
import Kv from '@/components/ui/Kv'
import Note from '@/components/ui/Note'
import { RDV_ETAT, getD, getLog, getOuv, hist } from '@/helpers/domain'
import { fday, fdur, toMin, toTime } from '@/helpers/dates'
import type { AppointmentPanelProps } from './types'

const AppointmentPanel = ({ r, setUi }: AppointmentPanelProps) => {
  const { S, mutate, toast } = useApp()
  const o = getOuv(S, r.ouvrierId)
  const d = r.demandeId ? getD(S, r.demandeId) : undefined
  const log = d && getLog(S, d.logementId)
  const [el, ec] = RDV_ETAT[r.etat]

  const cancel = () => {
    mutate(s => {
      s.rdvs = s.rdvs.filter(x => x.id !== r.id)
      const x = getD(s, r.demandeId)
      if (x && !s.rdvs.some(y => y.demandeId === x.id && y.etat === 'planned')) { x.statut = 'a_planifier'; hist(x, `Rendez-vous du ${fday(r.date)} annulé · à replanifier`) }
    }, { now: true })
    setUi({ rdvSel: '' })
    toast('Rendez-vous annulé')
  }
  const move = () => {
    if (!d) return
    mutate(s => {
      s.rdvs = s.rdvs.filter(x => x.id !== r.id)
      const x = getD(s, d.id)
      if (x) { x.statut = 'a_planifier'; hist(x, `Rendez-vous du ${fday(r.date)} déplacé`) }
    })
    setUi({ rdvSel: '', demandeId: d.id, ouvrierId: r.ouvrierId, date: r.date, debut: r.debut })
  }

  return (
    <>
      <div className="small muted font-bold tracking-[.05em]">RENDEZ-VOUS</div>
      <div className="row between"><strong className="text-base">{d ? <a href={`#/demande/${d.id}`}>{d.id}</a> : r.label}</strong><Chip tone={ec}>{el}</Chip></div>
      <Kv pairs={[
        ['Ouvrier', o?.nom], ['Date', fday(r.date)], ['Horaire', `${r.debut} – ${toTime(toMin(r.debut) + r.duree)}`],
        ['Logement', log ? `${log.id} · ${log.ville}` : '—'], ['Travaux', d ? d.lignes.map(l => l.piece + ' · ' + l.nature).join(', ') : r.label],
      ]} />
      {r.motifImp && <Note tone="warn">Report nécessaire : {r.motifImp}</Note>}
      {r.rapport && <Note>Temps passé {fdur(r.rapport.tempsMin)} · {r.rapport.conso.length} consommable(s)</Note>}
      <div className="row !gap-2">
        {d && <a className="btn btn-sm" href={`#/fiche/${d.id}`}>{r.rapport ? 'Rapport' : 'Fiche'}</a>}
        {d && r.etat === 'planned' && <button className="btn btn-sm" onClick={move}>Déplacer</button>}
        {r.etat === 'planned' && <button className="btn btn-sm btnd" onClick={cancel}>Annuler</button>}
      </div>
    </>
  )
}

export default AppointmentPanel
