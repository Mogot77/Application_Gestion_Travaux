import { useApp } from '@/hooks/useApp'
import { getD, hist } from '@/helpers/domain'
import { fday } from '@/helpers/dates'
import AppointmentPanelView from './AppointmentPanelView'
import { buildAppointmentModel } from './helpers'
import type { AppointmentPanelProps } from './types'

const AppointmentPanel = ({ r, setUi }: AppointmentPanelProps) => {
  const { S, mutate, toast } = useApp()
  const model = buildAppointmentModel(S, r)

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
    const d = r.demandeId ? getD(S, r.demandeId) : undefined
    if (!d) return
    mutate(s => {
      s.rdvs = s.rdvs.filter(x => x.id !== r.id)
      const x = getD(s, d.id)
      if (x) { x.statut = 'a_planifier'; hist(x, `Rendez-vous du ${fday(r.date)} déplacé`) }
    })
    setUi({ rdvSel: '', demandeId: d.id, ouvrierId: r.ouvrierId, renfortIds: r.renfortIds ?? [], date: r.date, debut: r.debut })
  }

  return <AppointmentPanelView model={model} onMove={move} onCancel={cancel} />
}

export default AppointmentPanel
