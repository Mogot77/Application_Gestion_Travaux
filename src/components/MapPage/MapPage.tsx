import { useMemo } from 'react'
import { useApp } from '@/hooks/useApp'
import { useUiState } from '@/hooks/useUiState'
import Layout from '@/components/Layout'
import { INIT } from './constants'
import { buildMapPageModel } from './helpers'
import MapPageView from './MapPageView'
import type { CrtUi } from './types'

/** Conteneur de la carte des logements : état global et filtres persistés. */
const MapPage = () => {
  const { S } = useApp()
  const [ui, setUi] = useUiState<CrtUi>('crt', INIT)
  const { dept, etab, mode } = ui
  // Le modèle (donc les repères de la carte) n'est recalculé que si l'état ou un filtre change
  const model = useMemo(() => buildMapPageModel(S, { dept, etab, mode }), [S, dept, etab, mode])
  return (
    <Layout active="carte">
      <MapPageView model={model} onDept={d => setUi({ dept: d })} onEtab={e => setUi({ etab: e })} onMode={m => setUi({ mode: m })} />
    </Layout>
  )
}

export default MapPage
