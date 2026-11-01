import type { Logement } from '@/types'
import type { OptItem } from '@/components/ui/Opts'
import type { InspectionRow } from '@/components/InspectionsTable'

export type ConstatsFilters = { prop: string; bati: string; sig: string; ctx: string; etab: string; per: string }

export type InspectionsFilter = { k: keyof ConstatsFilters; label: string; options: OptItem[] }

export type InspectionsMonthStats = { total: number; low: number; demandes: number; alertes: number }

export type InspectionsWithout = { l: Logement; last: string | undefined }

export type InspectionsModel = {
  filters: InspectionsFilter[]
  values: ConstatsFilters
  rows: InspectionRow[]
  month: InspectionsMonthStats
  sans: InspectionsWithout[]
}

export type InspectionsViewProps = {
  model: InspectionsModel
  onFilter: (k: keyof ConstatsFilters, v: string) => void
  onOpenPhoto: (src: string) => void
  onNoFollowUp: (constatId: string) => void
}
