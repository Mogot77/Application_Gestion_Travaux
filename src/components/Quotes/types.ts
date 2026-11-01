import type { Consultation, DecisionDevis, Demande, Entreprise, Logement } from '@/types'
import type { OptItem } from '@/components/ui/Opts'

export type QuotesProps = { id: string }

export type DecisionResult = { bc: string; ent: string }

/** Notes détaillées d'une entreprise ayant répondu. */
export type EntScore = { prix: number; delai: number; qualite: number; total: number; docsOk: boolean; docsLabel: string; complet: boolean; retenable: boolean }

export type CsScore = { res: Record<string, EntScore>; best: string | null; rec: string[] }

export type DecisionField = 'entrepriseId' | 'motif' | 'imputation'

/** Données calculées de l'écran « Devis reçus et décision ». */
export type QuotesModel = {
  c: Consultation
  d: Demande
  log?: Logement
  sc: CsScore
  ents: Entreprise[]
  declined: number
  waitingCount: number
  ecart: number | null
  dec: DecisionDevis
  decEntNom?: string
  chosenMontant?: number
  needDir: boolean
  locked: boolean
  lotsLabel: string
  recOptions: OptItem[]
  imputations: string[]
  seuilDirection: number
  isDir: boolean
  historique: Consultation['historique']
}

export type QuotesViewProps = {
  /** Null quand la consultation ou la demande est introuvable (voir `error`). */
  model: QuotesModel | null
  error?: string
  onRelance: () => void
  onExport: () => void
  onSetDecision: (field: DecisionField, value: string) => void
  onSubmit: () => void
  onValidate: () => void
  onRefuse: () => void
  /** Note de qualité saisie (texte brut du champ) pour une entreprise. */
  onQuality: (entId: string, value: string) => void
  /** Réponse (déjà nettoyée, non vide) à la question d'index `i`. */
  onAnswer: (i: number, text: string) => void
}
