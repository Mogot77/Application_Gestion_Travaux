import type { UrgenceKey } from '../types'

export const DAY_MAX = 420 // 7 h par jour et par ouvrier

/** État d'interface du planning (sélection en cours, semaine affichée). */
export type PlanUi = { demandeId: string; ouvrierId: string; date: string; debut: string; rdvSel: string; fUrg: '' | UrgenceKey; lastQ: string; week: string }
export const PLAN_KEY = 'plan'
export const PLAN_INIT: PlanUi = { demandeId: '', ouvrierId: '', date: '', debut: '', rdvSel: '', fUrg: '', lastQ: '', week: '' }

