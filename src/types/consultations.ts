import type { Histo } from './requests'

export type ReponseDevis = {
  statut: 'attente' | 'recu' | 'decline'
  date?: string
  motif?: string
  montantHT?: number
  tva?: number
  delai?: number
  duree?: number
  validite?: number
  postes?: number[]
  pdf?: string
  visite?: string
  slot?: string
  qualite?: number | null
}

export type DecisionDevis = {
  entrepriseId: string
  motif: string
  imputation: string
  statut: 'brouillon' | 'a_valider' | 'validee'
  bc?: string
  at?: string
}

export type Question = { q: string; a: string; at: string }

export type Consultation = {
  id: string
  demandeId: string
  statut: 'brouillon' | 'envoyee' | 'commande'
  mode: 'accord' | 'devis' | 'unique'
  lignes: number[]
  descriptif: string
  entreprises: string[]
  dateLimite: string
  heureLimite: string
  visite: boolean
  creneaux: string[]
  delai: string
  criteres: { prix: number; delai: number; qualite: number }
  estimation: string
  message: string
  motifUnique: string
  reponses: Record<string, ReponseDevis>
  questions: Question[]
  historique: Histo[]
  decision: DecisionDevis | null
  envoyeeLe?: string
}
