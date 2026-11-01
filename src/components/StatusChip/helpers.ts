import type { AppState, Demande, Tone } from '@/types'
import { fday } from '@/helpers/dates'
import { STAT, nextRdv } from '@/helpers/domain'

/** Libellé et teinte du statut d'une demande (avec date de planification si connue). */
export const statInfo = (S: AppState, d: Demande): [string, Tone] => {
  const [l, c] = STAT[d.statut] || [d.statut, 'gr']
  if (d.statut === 'planifiee') { const r = nextRdv(S, d); if (r) return [`Planifiée ${fday(r.date)}`, 'pg'] }
  if (d.statut === 'prestataire' && d.dateIntervention) return [`Planifiée ${fday(d.dateIntervention)}`, 'pg']
  return [l, c]
}
