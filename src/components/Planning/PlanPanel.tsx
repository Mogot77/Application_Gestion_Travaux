import type { Rdv, Demande } from '@/types'
import { useApp } from '@/hooks/useApp'
import { dureeST, firstFree, getD, getOuv, hist, nextId } from '@/helpers/domain'
import { DAY_END, DAY_START } from '@/helpers/planning'
import { fday, toMin, weekStart } from '@/helpers/dates'
import PlanPanelView from './PlanPanelView'
import { buildPlanPanelModel } from './helpers'
import type { PlanPanelProps } from './types'
import { reserveIds } from '@/store/queries/counters'

const PlanPanel = ({ d, ui, setUi }: PlanPanelProps) => {
  const { S, mutate, getS, toast } = useApp()
  const model = buildPlanPanelModel(S, d, ui)

  const dur = dureeST(d)
  const setOuv = (v: string) => setUi({ ouvrierId: v, renfortIds: (ui.renfortIds ?? []).filter(x => x !== v), ...(ui.date ? { debut: firstFree(S, v, ui.date, dur) } : {}) })
  const toggleRenfort = (id: string, on: boolean) => setUi({ renfortIds: on ? [...new Set([...(ui.renfortIds ?? []), id])] : (ui.renfortIds ?? []).filter(x => x !== id) })
  const setDate = (v: string) => setUi({ date: v, ...(ui.ouvrierId && v ? { debut: firstFree(S, ui.ouvrierId, v, dur) } : {}), ...(v ? { week: weekStart(v) } : {}) })
  const upd = (fn: (x: Demande) => void) => mutate(s => { const x = getD(s, d.id); if (x) fn(x) })

  const addConso = (cnom: string, cqte: string, corg: string): boolean => {
    const nom = cnom.trim()
    if (!nom) { toast('Désignation du consommable ?', 'err'); return false }
    upd(x => { x.consommables.push({ nom, qte: Number(cqte) || 1, origine: corg, pris: false }) })
    return true
  }
  const planifier = async () => {
    const o = getOuv(S, ui.ouvrierId)
    if (!o || !ui.date || !ui.debut) return toast('Choisissez un ouvrier, une date et un créneau', 'err')
    if (toMin(ui.debut) < toMin(DAY_START) || toMin(ui.debut) + dur > toMin(DAY_END)) return toast(`La mission doit tenir entre ${DAY_START} et ${DAY_END}`, 'err')
    const renforts = (ui.renfortIds ?? []).filter(id => id !== o.id && getOuv(S, id))
    const equipe = [o.nom, ...renforts.map(id => getOuv(S, id)?.nom ?? '')].join(', ')
    if (!getD(getS(), d.id)?.ft) await reserveIds(getS(), ['ft'])
    let rdv: Rdv | undefined
    mutate(s => {
      const x = getD(s, d.id)
      if (!x) return
      const r: Rdv = { id: 'R' + Date.now(), ouvrierId: o.id, ...(renforts.length ? { renfortIds: renforts } : {}), date: ui.date, debut: ui.debut, duree: dureeST(x), label: `${x.id.slice(-4)} ${x.lignes[0].nature.split(' ')[0]}`, etat: 'planned', demandeId: x.id }
      s.rdvs.push(r)
      x.ft = x.ft || nextId(s, 'ft')
      x.statut = 'planifiee'
      x.lignes.forEach(l => { if (l.circuit === 'ST' && !l.statut) l.statut = 'planifiee' })
      hist(x, `Planifiée ${fday(ui.date)} ${ui.debut} · ${equipe}`)
      hist(x, `Rendez-vous envoyé dans l'agenda Outlook de ${equipe} · statut visible par l'établissement`)
      rdv = r
    }, { now: true })
    if (!rdv) return
    setUi({ demandeId: '', ouvrierId: '', renfortIds: [], date: '', debut: '', rdvSel: rdv.id })
    toast(`${d.id} planifiée ${fday(rdv.date)} à ${rdv.debut} avec ${equipe}`, 'ok')
  }

  return (
    <PlanPanelView
      model={model}
      onOuvrier={setOuv} onToggleRenfort={toggleRenfort} onDate={setDate} onDebut={debut => setUi({ debut })}
      onToggleConso={(i, pris) => upd(x => { x.consommables[i].pris = pris })}
      onRemoveConso={i => upd(x => { x.consommables.splice(i, 1) })}
      onAddConso={addConso} onPlan={planifier}
      onClose={() => setUi({ demandeId: '', ouvrierId: '', renfortIds: [], date: '', debut: '' })}
    />
  )
}

export default PlanPanel
