import type { AppState } from '@/types'
import { factureErrors, factureTotals } from '@/helpers/billing'
import type { InvoiceModel } from './types'

/** Modèle de l'écran facture ; null si la facture n'existe pas. */
export const buildInvoiceModel = (S: AppState, id: string): InvoiceModel | null => {
  const f = S.factures.find(x => x.id === id)
  if (!f) return null
  return { f, totals: factureTotals(f.lignes), errors: factureErrors(f), editable: f.statut === 'brouillon' }
}
