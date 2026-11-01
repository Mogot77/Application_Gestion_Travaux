import type { Consultation as Cs, Demande, Entreprise, Logement } from '@/types'

export type TextField = 'motifUnique' | 'descriptif' | 'estimation' | 'delai' | 'message' | 'dateLimite' | 'heureLimite'

export type ConsultationProps = { id: string }

export type CritereKey = 'prix' | 'delai' | 'qualite'

export type ConsultationMode = Cs['mode']

/** Option du sélecteur de mode d'achat : [clé, titre, sous-titre]. */
export type ModeOption = [ConsultationMode, string, string]

/** Données calculées du formulaire de consultation (brouillon). */
export type ConsultationModel = {
  c: Cs
  d: Demande
  log?: Logement
  lots: string[]
  shown: Entreprise[]
  sumCrit: number
  nph: number
  sendLabel: string
  warn3: boolean
  seuilTroisDevis: number
  seuilDirection: number
}

export type ConsultationViewProps = {
  /** Null quand la demande est introuvable (voir `error`). */
  model: ConsultationModel | null
  error?: string
  onSaveDraft: () => void
  onSend: () => void
  onSetMode: (mode: ConsultationMode) => void
  onField: (field: TextField, value: string) => void
  onToggleLine: (index: number, on: boolean) => void
  onAddEnt: () => void
  onRemoveEnt: (entId: string) => void
  onVisite: (on: boolean) => void
  onCreneau: (index: number, value: string) => void
  /** Valeur brute du champ de pondération (texte). */
  onCritere: (key: CritereKey, value: string) => void
  onOpenPhoto: (src: string) => void
}
