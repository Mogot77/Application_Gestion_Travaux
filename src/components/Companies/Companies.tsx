import { useApp } from '@/hooks/useApp'
import { useUiState } from '@/hooks/useUiState'
import Layout from '@/components/Layout'
import { buildCompaniesModel } from './helpers'
import type { CompaniesUi } from './types'
import CompaniesView from './CompaniesView'

/** Conteneur du suivi des entreprises consultées : état global et filtres persistés. */
const Companies = () => {
  const { S } = useApp()
  const [ui, setUi] = useUiState<CompaniesUi>('ent', { q: '', f: '' })

  return (
    <Layout active="entreprises">
      <CompaniesView ui={ui} model={buildCompaniesModel(S, ui)} onChange={setUi} />
    </Layout>
  )
}

export default Companies
