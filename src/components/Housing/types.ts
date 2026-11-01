import type { ReactNode } from 'react'
import type { Demande, Logement, Tone } from '@/types'
import type { MapFocus, MapSpec } from '@/components/MapView'
import type { InspectionRow } from '@/components/InspectionsTable'
import type { HousingTreeViewProps } from '@/components/HousingTree'

export type LogTab = 'synthese' | 'inter' | 'constats' | 'docs'

export type LogUi = { q: string; dept: string; typo: string; etab: string; tab: LogTab; tabFor: string }

export type HousingProps = { id?: string }

export type InterventionsTableProps = { ds: Demande[] }

export type LocationCardProps = { sel: Logement }

export type HousingFormProps = { etabs: string[] }

/* ───────── Tableau des interventions ───────── */

/** Ligne du tableau des interventions d'un logement. */
export type InterventionRow = {
  id: string
  /** Date de l'intervention (ou « prévue ») ; vide si seule la date de la demande est connue. */
  date: string
  /** Date de la demande, affichée quand aucune date d'intervention n'existe. */
  requestDate: string
  pieces: string
  natures: string
  circuit: string
  imputation: string
  statusLabel: string
  statusTone: Tone
  /** Vrai quand la fiche d'intervention (PDF) est disponible. */
  done: boolean
}

export type InterventionsTableViewProps = { rows: InterventionRow[] }

/* ───────── Carte de localisation ───────── */

export type LocationCardModel = {
  id: string
  ville: string
  approx: boolean
  busy: boolean
  spec: MapSpec
  focus: MapFocus
}

export type LocationCardViewProps = LocationCardModel & { onGeolocate: () => void; onReset: () => void }

/* ───────── Écran logements ───────── */

export type HousingListItem = { id: string; typo: string; apt: string; adresse: string; resume: string; selected: boolean }

export type HousingListGroup = { key: string; items: HousingListItem[] }

export type HousingListModel = {
  actifs: number
  groups: HousingListGroup[]
  /** Valeurs courantes des filtres. */
  values: { q: string; dept: string; typo: string; etab: string }
  etabs: string[]
  /** Profil établissement : pas de création ni de filtre par établissement. */
  restricted: boolean
}

export type HousingPiece = { name: string; count?: { n: number; open: boolean } }

export type HousingLastInspection = {
  photo?: string
  date: string
  contexte: string
  proprete: number
  propreteTone: Tone
  bati: string
  batiTone: Tone
  auteur: string
  fonction: string
}

export type HousingDetailModel = {
  id: string
  typoLabel: string
  actif: boolean
  adresse: string
  infoLeft: [string, string][]
  infoRight: [string, string][]
  tabs: { key: LogTab; label: string }[]
  tab: LogTab
  pieces: HousingPiece[]
  lastInspection?: HousingLastInspection
  /** Nombre de demandes sur 12 mois. */
  yearCount: number
  recent: InterventionRow[]
  interventions: InterventionRow[]
  constats: InspectionRow[]
  treePath: string
  tree: HousingTreeViewProps
}

export type HousingModel = {
  list: HousingListModel
  /** Logement sélectionné ; absent quand aucun logement ne correspond. */
  detail?: HousingDetailModel
}

export type HousingViewProps = {
  model: HousingModel
  /** Carte de localisation, fournie par le conteneur (déplacement du repère et géocodage). */
  location: ReactNode
  onSearch: (q: string) => void
  onDept: (dept: string) => void
  onTypo: (typo: string) => void
  onEtab: (etab: string) => void
  onNew: () => void
  onTab: (tab: LogTab) => void
  onOpenPhoto: (src: string) => void
  onNoFollowUp: (constatId: string) => void
}
