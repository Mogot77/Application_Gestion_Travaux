import type { ConstatsFilters } from './types'

export const INIT: ConstatsFilters = { prop: '', bati: '', sig: '', ctx: '', etab: '', per: '30' }

/** Un logement sans constat depuis plus de ce nombre de jours est signalé. */
export const SANS_CONSTAT_JOURS = 182
