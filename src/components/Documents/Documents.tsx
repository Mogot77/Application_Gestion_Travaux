import { useApp } from '@/hooks/useApp'
import { useUiState } from '@/hooks/useUiState'
import Layout from '@/components/Layout'
import DocumentsView from './DocumentsView'
import { buildDocumentsModel } from './helpers'
import type { DocumentsUi } from './types'

/** Conteneur du plan de classement : état global et filtre de la vue SharePoint. */
const Documents = () => {
  const { S } = useApp()
  const [ui, setUi] = useUiState<DocumentsUi>('cl', { v: '' })
  return (
    <Layout active="classement">
      <DocumentsView model={buildDocumentsModel(S, ui)} onView={v => setUi({ v })} />
    </Layout>
  )
}

export default Documents
