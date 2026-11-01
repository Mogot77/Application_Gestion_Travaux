import { useApp } from '@/hooks/useApp'
import { useUiState } from '@/hooks/useUiState'
import Layout from '@/components/Layout'
import { csv, download } from '@/helpers/csv'
import { INIT } from './constants'
import { buildDashboardCsvRows, buildDashboardModel } from './helpers'
import type { TbUi } from './types'
import DashboardView from './DashboardView'

/** Conteneur du tableau de bord : état global, filtres persistés et export CSV. */
const Dashboard = () => {
  const { S } = useApp()
  const [ui, setUi] = useUiState<TbUi>('tb', INIT)
  const model = buildDashboardModel(S, ui)
  const exportCsv = () => download(`tableau-de-bord_${ui.mois}.csv`, csv(buildDashboardCsvRows(S, ui)))

  return (
    <Layout active="tableau">
      <DashboardView ui={ui} model={model} onChange={setUi} onExport={exportCsv} />
    </Layout>
  )
}

export default Dashboard
