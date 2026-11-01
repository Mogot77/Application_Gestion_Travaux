import Layout from '@/components/Layout'
import { useApp } from '@/hooks/useApp'
import { go } from '@/hooks/useRoute'
import { useUiState } from '@/hooks/useUiState'
import { TODAY } from '@/helpers/dates'
import { csv, download } from '@/helpers/csv'
import { INIT } from './constants'
import { buildCsvData, buildRequestsModel } from './helpers'
import RequestsView from './RequestsView'
import type { DemUi } from './types'

const Requests = () => {
  const { S, toast } = useApp()
  const [ui, setUi] = useUiState<DemUi>('dem', INIT)
  const model = buildRequestsModel(S, ui)

  const exportCsv = () => {
    download(`demandes_${TODAY}.csv`, csv(buildCsvData(S, model.filtered)))
    toast(`${model.filtered.length} demandes exportées (CSV lisible par Excel)`, 'ok')
  }
  const toggleSel = (id: string, on: boolean) => setUi({ sel: on ? [...new Set([...ui.sel, id])] : ui.sel.filter(x => x !== id) })

  return (
    <Layout active="demandes">
      <RequestsView
        model={model} ui={ui} onUi={setUi} onExport={exportCsv} onToggleSel={toggleSel}
        onPrint={() => ui.sel.length && go('#/fiche/' + ui.sel.join(','))}
      />
    </Layout>
  )
}

export default Requests
