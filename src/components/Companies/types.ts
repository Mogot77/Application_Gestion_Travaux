import type { Consultation, Entreprise, ReponseDevis } from '@/types'

export type Invitation = { cs: Consultation; rep: ReponseDevis; closed: boolean }

export type EntStats = { invitations: Invitation[]; recus: number; attente: number; declines: number; retenus: number; docsOk: boolean }

export type CompaniesUi = { q: string; f: string }

/** Ligne de consultation d'une entreprise, prête à afficher. */
export type InvitationRow = { id: string; lots: string; ville?: string; dateLimite: string; heureLimite: string; rep: ReponseDevis; closed: boolean }

export type CompanyRow = {
  e: Entreprise
  attente: number
  recus: number
  retenus: number
  docsOk: boolean
  invitations: InvitationRow[]
}

export type CompaniesModel = { total: number; totalAttente: number; rows: CompanyRow[] }

export type CompaniesViewProps = {
  ui: CompaniesUi
  model: CompaniesModel
  onChange: (patch: Partial<CompaniesUi>) => void
}
