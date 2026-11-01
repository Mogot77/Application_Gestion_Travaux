import type { OptItem } from '@/components/ui/Opts'

export type DashboardProps = Record<string, never>

export type TbUi = { mois: string; dept: string; etab: string }

/** Ligne du tableau « Par établissement » : [établissement, demandes, renvoyées, ajouts sur place, délai moyen]. */
export type EtabRow = readonly [string, number, number, number, number | null]

/** Données calculées du tableau de bord pour un filtre donné. */
export type DashboardModel = {
  months: OptItem[]
  etabOptions: string[]
  moisCount: number
  urg: number
  delST: number | null
  delUrg: number | null
  reportedCount: number
  in48: number
  heures: number
  imp: number
  refac: number
  hors: number
  lotTitle: string
  lotRows: [string, number][]
  maxLot: number
  last6: string[]
  vol: number[]
  maxV: number
  circ: [string, number | null][]
  maxC: number
  etabs: EtabRow[]
}

export type DashboardViewProps = {
  ui: TbUi
  model: DashboardModel
  onChange: (patch: Partial<TbUi>) => void
  onExport: () => void
}
