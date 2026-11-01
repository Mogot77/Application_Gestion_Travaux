import { useApp } from '@/hooks/useApp'
import { buildInterventionRows } from './helpers'
import InterventionsTableView from './InterventionsTableView'
import type { InterventionsTableProps } from './types'

/** Conteneur du tableau des interventions d'un logement. */
const InterventionsTable = ({ ds }: InterventionsTableProps) => {
  const { S } = useApp()
  return <InterventionsTableView rows={buildInterventionRows(S, ds)} />
}

export default InterventionsTable
