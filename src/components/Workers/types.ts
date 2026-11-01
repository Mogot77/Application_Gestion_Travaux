import type { Ouvrier } from '@/types'

export type WorkersProps = Record<string, never>

export type OuvrierStats = { total: number; week: number; avenir: number }

export type ColorPickerProps = { initial: string }

export type WorkerFormProps = { o: Partial<Ouvrier>; metiers: string[]; defaultColor: string }

/** État d'interface de l'écran (recherche, affichage des ouvriers désactivés). */
export type WorkersUi = { q: string; inactifs: boolean }

export type WorkerRow = { o: Ouvrier; stats: OuvrierStats }

export type WorkersModel = {
  rows: WorkerRow[]
  /** Nombre total d'ouvriers (avant filtre). */
  total: number
  nActifs: number
  nInactifs: number
  /** Droit de modification (faux pour les établissements). */
  can: boolean
}

export type WorkersViewProps = {
  model: WorkersModel
  q: string
  showInactive: boolean
  onQuery: (q: string) => void
  onShowInactive: (v: boolean) => void
  onCreate: () => void
  onEdit: (o: Ouvrier) => void
  onToggle: (o: Ouvrier) => void
  onDelete: (o: Ouvrier) => void
}
