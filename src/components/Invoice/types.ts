import type { Emetteur, Facture, FactureLigne, Partie } from '@/types'
import type { FactureTotals } from '@/helpers/billing'

export type InvoiceProps = { id: string }

export type InvoiceMetaPatch = Partial<Pick<Facture, 'date' | 'echeance' | 'prestation' | 'objet' | 'notes'>>

export type InvoiceModel = {
  f: Facture
  totals: FactureTotals
  /** Mentions obligatoires manquantes (bloquent l'émission). */
  errors: string[]
  /** Brouillon : tous les champs sont modifiables. */
  editable: boolean
}

export type InvoiceViewProps = {
  /** Null quand la facture est introuvable. */
  model: InvoiceModel | null
  onMeta: (patch: InvoiceMetaPatch) => void
  onEmetteur: (patch: Partial<Emetteur>) => void
  onDestinataire: (patch: Partial<Partie>) => void
  onLigne: (index: number, patch: Partial<FactureLigne>) => void
  onAddLigne: () => void
  onRemoveLigne: (index: number) => void
  onEmit: () => void
  onPaid: () => void
  onCancel: () => void
  onPrint: () => void
}
