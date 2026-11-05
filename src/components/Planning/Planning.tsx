import { useEffect } from 'react'
import { useApp } from '@/hooks/useApp'
import { go, useRoute } from '@/hooks/useRoute'
import { useUiState } from '@/hooks/useUiState'
import { getUi, patchUi } from '@/store/local/uiState'
import Layout from '@/components/Layout'
import { dureeST, firstFree, getD } from '@/helpers/domain'
import { PLAN_INIT, PLAN_KEY, type PlanUi } from '@/helpers/planning'
import { TODAY, addDays, weekStart } from '@/helpers/dates'
import PlanningView from './PlanningView'
import PlanPanel from './PlanPanel'
import AppointmentPanel from './AppointmentPanel'
import { buildPlanningModel, getRdv } from './helpers'

const Planning = () => {
  const { S, getS } = useApp()
  const { query: q } = useRoute()
  const [ui, setUi] = useUiState<PlanUi>(PLAN_KEY, PLAN_INIT)

  // Arrivée depuis une demande (?sel=…) : présélection ou affichage du rendez-vous existant
  useEffect(() => {
    if (!q.sel) return
    const cur = getUi(PLAN_KEY, PLAN_INIT)
    if (q.sel === cur.lastQ) return
    const patch: Partial<PlanUi> = { lastQ: q.sel, demandeId: q.sel, rdvSel: '', ouvrierId: '', renfortIds: [], date: '', debut: '' }
    if (q.w) patch.week = weekStart(q.w)
    const s = getS()
    const d = getD(s, q.sel)
    const r = d && s.rdvs.filter(x => x.demandeId === d.id && x.etat !== 'imp').sort((a, b) => (b.date + b.debut).localeCompare(a.date + a.debut))[0]
    if (d && d.statut !== 'a_planifier' && d.statut !== 'acces_impossible' && r) Object.assign(patch, { demandeId: '', rdvSel: r.id, week: weekStart(r.date) })
    patchUi(PLAN_KEY, PLAN_INIT, patch)
  }, [q.sel, q.w, getS])

  const model = buildPlanningModel(S, ui)
  const ws = model.week
  const sel = ui.demandeId ? getD(S, ui.demandeId) : undefined
  const rdvSel = ui.rdvSel ? getRdv(S, ui.rdvSel) : undefined

  const side = sel ? <PlanPanel d={sel} ui={ui} setUi={setUi} />
    : rdvSel ? <AppointmentPanel r={rdvSel} setUi={setUi} />
      : <div className="muted s13">Sélectionnez une demande à planifier (ou glissez-la sur un créneau), ou cliquez sur un rendez-vous pour le consulter.</div>

  return (
    <Layout active="planning">
      <PlanningView
        model={model} side={side}
        onPrevWeek={() => setUi({ week: addDays(ws, -7) })}
        onNextWeek={() => setUi({ week: addDays(ws, 7) })}
        onThisWeek={() => setUi({ week: weekStart(TODAY) })}
        onFilter={k => setUi({ fUrg: k })}
        onSelectCard={id => { if (ui.demandeId !== id) setUi({ demandeId: id, rdvSel: '', ouvrierId: '', renfortIds: [], date: '', debut: '' }) }}
        onCell={(o, dt) => { if (ui.demandeId) { const sd = getD(S, ui.demandeId); setUi({ ouvrierId: o, renfortIds: (ui.renfortIds ?? []).filter(x => x !== o), date: dt, debut: firstFree(S, o, dt, sd ? dureeST(sd) : 0) }) } }}
        onSelectRdv={id => setUi({ rdvSel: id, demandeId: '' })}
        onDropCard={(id, o, dt) => {
          const sd = getD(S, id)
          if (!sd) return
          setUi({ demandeId: id, rdvSel: '', ouvrierId: o, renfortIds: [], date: dt, debut: firstFree(S, o, dt, dureeST(sd)) })
        }}
        onMap={() => go('#/tournees')}
      />
    </Layout>
  )
}

export default Planning
