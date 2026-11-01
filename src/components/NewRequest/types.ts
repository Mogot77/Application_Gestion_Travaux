import type { Constat, DraftDemande, Logement, SinistreInfo, UrgenceKey, UrgenceRef } from '@/types'

export type CheckItem = ['ok' | 'wa' | 'na', string]

export type CheckResult = { items: CheckItem[]; ok: boolean }

/** Champs texte simples du brouillon, modifiables via `onField`. */
export type DraftField = 'auteur' | 'fonction' | 'tel' | 'canal' | 'dateSouhaitee' | 'acces' | 'numCles' | 'lieuCles' | 'facturation' | 'sinistre' | 'observations'

export type LineField = 'piece' | 'lot' | 'nature' | 'description'

/** Logements d'une ville, déjà filtrés selon le profil, pour la liste de choix. */
export type LogementGroup = { ville: string; items: { id: string; label: string }[] }

/** Modèle d'affichage de la fiche de demande (calculé à partir de l'état et du brouillon). */
export type NewRequestModel = {
  dr: DraftDemande
  log?: Logement
  constat?: Constat
  check: CheckResult
  isCoord: boolean
  service: string
  groups: LogementGroup[]
  urgences: UrgenceRef[]
  urgenceDesc: string
  fonctions: string[]
  cles: string[]
  natSinistre: string[]
  lots: Record<string, string[]>
  pieces: string[]
  autresPieces: string[]
  arrivee: { v: string; l: string }[]
}

export type NewRequestViewProps = {
  model: NewRequestModel
  onField: (k: DraftField, v: string) => void
  onUrgence: (k: UrgenceKey) => void
  onSinistreInfo: (k: keyof SinistreInfo, v: string) => void
  onLogement: (id: string) => void
  onLine: (i: number, k: LineField, v: string) => void
  onExtra: (i: number, k: string, v: string) => void
  onAddLine: () => void
  onRemoveLine: (i: number) => void
  onAddPhotos: (i: number, files: FileList) => void
  onDeletePhoto: (i: number, j: number) => void
  onOpenPhoto: (src: string) => void
  onSend: () => void
  onSave: () => void
  onDiscard: () => void
}
