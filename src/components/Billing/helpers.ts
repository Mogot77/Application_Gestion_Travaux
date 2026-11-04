import type { AppState } from '@/types'
import { factureTotals, refacturables } from '@/helpers/billing'
import { getLog } from '@/helpers/domain'
import type { BillingModel, BillingUi } from './types'

/** Modèle de la liste des factures : filtre par statut / recherche, totaux, demandes à facturer. */
export const buildBillingModel = (S: AppState, ui: BillingUi): BillingModel => {
  const q = ui.q.trim().toLowerCase()
  const all = S.factures.map(f => ({ f, ttc: factureTotals(f.lignes).totalTTC }))
  const rows = all
    .filter(r => (!ui.statut || r.f.statut === ui.statut) && (!q || `${r.f.id} ${r.f.demandeId} ${r.f.destinataire.nom}`.toLowerCase().includes(q)))
    .sort((a, b) => b.f.id.localeCompare(a.f.id))
  const sum = (st: string) => all.filter(r => r.f.statut === st).reduce((s, r) => s + r.ttc, 0)
  return {
    rows,
    candidates: refacturables(S).map(d => ({ v: d.id, l: `${d.id} · ${getLog(S, d.logementId)?.adresse ?? ''}` })),
    totalAPayer: sum('emise'), totalPaye: sum('payee'),
  }
}
