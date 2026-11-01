import type { Demande, Logement, Tone } from '@/types'
import type { OptItem } from '@/components/ui/Opts'

export type TabKey = 'toutes' | 'a_traiter' | 'a_qualifier' | 'a_planifier' | 'occupants' | 'a_reactualiser' | 'cloturees'

export type FilterKey = 'etab' | 'dept' | 'lot' | 'urgence' | 'circuit' | 'statut'

export type DemUi = { tab: TabKey; q: string; etab: string; dept: string; lot: string; urgence: string; circuit: string; statut: string; page: number; sel: string[] }

/** Ligne du tableau, avec toutes les valeurs déjà calculées. */
export type RequestRow = {
  d: Demande
  log?: Logement
  action: [string, string]
  age: number
  closed: boolean
  reactualiser: boolean
  circuit: string
  status: [string, Tone]
  urgence: [string, Tone] | null
  photos: number
}

export type RequestTab = { key: TabKey; label: string; badge?: number; badgeClassName: string }

export type RequestFilter = { key: FilterKey; label: string; options: OptItem[] }

/** Modèle d'affichage de l'écran Demandes (calculé à partir de l'état et des filtres). */
export type RequestsModel = {
  subtitle: string
  tabs: RequestTab[]
  filters: RequestFilter[]
  hasFilter: boolean
  /** Toutes les demandes correspondant aux filtres (sert à l'export). */
  filtered: Demande[]
  shown: RequestRow[]
  page: number
  pages: number
  reactualiser: number
  horsProcedure: number
}

export type RequestsViewProps = {
  model: RequestsModel
  ui: DemUi
  onUi: (patch: Partial<DemUi>) => void
  onExport: () => void
  onPrint: () => void
  onToggleSel: (id: string, on: boolean) => void
}
