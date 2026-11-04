import type { Facture } from '@/types'

export type BillingUi = { q: string; statut: string }

export type BillingRow = { f: Facture; ttc: number }

export type BillingModel = {
  rows: BillingRow[]
  /** Demandes proposables pour une nouvelle facture. */
  candidates: { v: string; l: string }[]
  totalAPayer: number
  totalPaye: number
}

export type BillingViewProps = {
  ui: BillingUi
  model: BillingModel
  /** Demande choisie dans la liste « Nouvelle facture ». */
  onCreate: (demandeId: string) => void
  onChange: (patch: Partial<BillingUi>) => void
}
