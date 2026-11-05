import type { UrgenceKey } from '../types'

export const DAY_MAX = 420 // 7 h par jour et par ouvrier
/** Plage de travail du personnel : aucun rendez-vous avant 8 h ni après 18 h. */
export const DAY_START = '08:00'
export const DAY_END = '18:00'

/** État d'interface du planning (sélection en cours, semaine affichée). */
export type PlanUi = { demandeId: string; ouvrierId: string; date: string; debut: string; rdvSel: string; renfortIds: string[]; fUrg: '' | UrgenceKey; lastQ: string; week: string }
export const PLAN_KEY = 'plan'
export const PLAN_INIT: PlanUi = { demandeId: '', ouvrierId: '', date: '', debut: '', rdvSel: '', renfortIds: [], fUrg: '', lastQ: '', week: '' }

