import type { AppState, Demande, Logement } from '@/types'
import { CLOSED } from '@/helpers/domain'

export const info = (S: AppState, l: Logement): { ds: Demande[]; urgent: boolean; color: string } => {
  const ds = S.demandes.filter(d => d.logementId === l.id && !CLOSED.includes(d.statut) && d.statut !== 'brouillon')
  const urgent = ds.some(d => d.urgence === 'urgent')
  return { ds, urgent, color: urgent ? '#B42318' : ds.length ? '#B54708' : '#6B7280' }
}
