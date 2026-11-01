import type { AppState, Rdv } from '@/types'

/** Interventions d'un ouvrier, triées par date puis heure de début. */
export const rdvsOf = (S: AppState, id?: string): Rdv[] =>
  id ? S.rdvs.filter(r => r.ouvrierId === id).sort((a, b) => (a.date + a.debut).localeCompare(b.date + b.debut)) : []
