import { useMemo } from 'react'
import Layout from '@/components/Layout'
import { useApp } from '@/hooks/useApp'
import { go } from '@/hooks/useRoute'
import { useUiState } from '@/hooks/useUiState'
import { patchUi } from '@/store/local/uiState'
import { PLAN_INIT, PLAN_KEY } from '@/helpers/planning'
import { firstFree, ouvActifs } from '@/helpers/domain'
import { TODAY, weekStart } from '@/helpers/dates'
import { TOUR_INIT, TOUR_KEY } from './constants'
import { buildToursModel, mapSpec } from './helpers'
import ToursView from './ToursView'
import type { TourUi } from './types'

const Tours = () => {
  const { S } = useApp()
  const [ui, setUi] = useUiState<TourUi>(TOUR_KEY, TOUR_INIT)
  const ouvs = useMemo(() => ouvActifs(S), [S])
  const model = buildToursModel(S, ouvs, ui.ouv)

  const spec = useMemo(() => mapSpec(S, ouvs, ui.hide, model.ouvId, id => setUi({ ouv: id })), [S, ouvs, ui.hide, model.ouvId, setUi])

  const toggle = (id: string) => setUi({ hide: ui.hide.includes(id) ? ui.hide.filter(x => x !== id) : [...ui.hide, id] })
  const affecter = (demandeId: string, ouvrierId: string) => {
    patchUi(PLAN_KEY, PLAN_INIT, { demandeId, rdvSel: '', ouvrierId, date: TODAY, debut: firstFree(S, ouvrierId, TODAY), lastQ: demandeId, week: weekStart(TODAY) })
    go('#/planning')
  }

  return (
    <Layout active="planning">
      <ToursView
        model={model} hide={ui.hide} spec={spec}
        onToggle={toggle} onSelectTeam={id => setUi({ ouv: id, hide: ui.hide.filter(h => h !== id) })}
        onAssign={affecter} onCalendar={() => go('#/planning')}
      />
    </Layout>
  )
}

export default Tours
