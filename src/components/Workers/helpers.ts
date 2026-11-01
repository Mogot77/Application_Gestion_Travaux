import type { AppState, Ouvrier } from '@/types'
import { TODAY, weekStart } from '@/helpers/dates'
import type { OuvrierStats } from './types'

export const stats = (S: AppState, o: Ouvrier): OuvrierStats => {
  const rdvs = S.rdvs.filter(r => r.ouvrierId === o.id)
  const ws = weekStart(TODAY)
  const week = rdvs.filter(r => weekStart(r.date) === ws).reduce((s, r) => s + r.duree, 0)
  const avenir = rdvs.filter(r => r.etat === 'planned' && r.date >= TODAY).length
  return { total: rdvs.length, week, avenir }
}
