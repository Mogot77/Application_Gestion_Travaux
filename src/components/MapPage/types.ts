import type { MapSpec } from '@/components/MapView'

export type MapPageProps = Record<string, never>

export type CrtUi = { dept: string; etab: string; mode: 'tous' | 'demandes' | 'urgent' }

/** Logement ayant au moins une demande en cours (liste latérale). */
export type MapPageRequestRow = { id: string; ville: string; color: string; ids: string; count: number; urgent: boolean }

export type MapPageModel = {
  total: number
  withRequests: number
  urgent: number
  approx: number
  spec: MapSpec
  /** Clé qui force le recadrage de la carte quand les filtres changent. */
  refitKey: string
  rows: MapPageRequestRow[]
  /** Liste des établissements ; absente pour un profil établissement (filtre masqué). */
  etabs?: string[]
  values: CrtUi
}

export type MapPageViewProps = {
  model: MapPageModel
  onDept: (dept: string) => void
  onEtab: (etab: string) => void
  onMode: (mode: CrtUi['mode']) => void
}
