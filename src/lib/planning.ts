import type { Demande, UrgenceKey } from '../types'

export const DAY_MAX = 420 // 7 h par jour et par ouvrier

/** État d'interface du planning (sélection en cours, semaine affichée). */
export interface PlanUi { demandeId: string; ouvrierId: string; date: string; debut: string; rdvSel: string; fUrg: '' | UrgenceKey; lastQ: string; week: string }
export const PLAN_KEY = 'plan'
export const PLAN_INIT: PlanUi = { demandeId: '', ouvrierId: '', date: '', debut: '', rdvSel: '', fUrg: '', lastQ: '', week: '' }

const URG_ORDER = { urgent: 0, h48: 1, prog: 2 }
export const planQueue = (demandes: Demande[]) => demandes.filter(d => ['a_planifier', 'acces_impossible'].includes(d.statut))
  .sort((a, b) => (URG_ORDER[a.urgence] - URG_ORDER[b.urgence]) || a.recueLe.localeCompare(b.recueLe))
