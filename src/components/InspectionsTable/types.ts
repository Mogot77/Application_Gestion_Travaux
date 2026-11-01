import type { Constat, Logement } from '@/types'

export type InspectionsTableProps = { list: Constat[]; withLog: boolean }

export type InspectionRow = { c: Constat; logement?: Logement; alert: boolean }

export type InspectionsTableViewProps = {
  rows: InspectionRow[]
  withLog: boolean
  onOpenPhoto: (src: string) => void
  onNoFollowUp: (constatId: string) => void
}
