import { useApp } from '@/hooks/useApp'
import { useUiState } from '@/hooks/useUiState'
import Layout from '@/components/Layout'
import InspectionsView from './InspectionsView'
import { INIT } from './constants'
import { buildInspectionsModel } from './helpers'
import type { ConstatsFilters } from './types'

/** Conteneur de la liste des constats : filtres persistés, classement sans suite et aperçu de photo. */
const Inspections = () => {
  const { S, mutate, toast, openModal } = useApp()
  const [ui, setUi] = useUiState<ConstatsFilters>('ce', INIT)
  const sansSuite = (id: string) => {
    mutate(s => { const c = s.constats.find(x => x.id === id); if (c) c.suite = 'aucune' }, { now: true })
    toast('Constat classé sans suite')
  }
  return (
    <Layout active="constats">
      <InspectionsView
        model={buildInspectionsModel(S, ui)}
        onFilter={(k, v) => setUi({ [k]: v })}
        onOpenPhoto={src => openModal({ title: 'Photo', wide: true, noFooter: true, body: <img src={src} alt="Photo" className="w-full rounded-lg" /> })}
        onNoFollowUp={sansSuite}
      />
    </Layout>
  )
}

export default Inspections
