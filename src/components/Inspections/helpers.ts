import type { AppState, Constat, Logement } from '@/types'
import { getLog, profilOf } from '@/helpers/domain'
import { TODAY, diffDays } from '@/helpers/dates'
import { SANS_CONSTAT_JOURS } from './constants'
import type { ConstatsFilters } from './types'

/** Constats correspondant aux filtres, du plus récent au plus ancien. */
export const filterConstats = (S: AppState, ui: ConstatsFilters): Constat[] => S.constats.filter(c => {
  const l = getLog(S, c.logementId)
  if (ui.prop !== '' && c.proprete > Number(ui.prop)) return false
  if (ui.bati && c.bati !== ui.bati) return false
  if (ui.sig && !c.signalements.includes(ui.sig)) return false
  if (ui.ctx && c.contexte !== ui.ctx) return false
  if (ui.etab && l?.etab !== ui.etab) return false
  if (ui.per && diffDays(c.date, TODAY) > Number(ui.per)) return false
  if (S.profil === 'etab' && l?.etab !== profilOf(S).etab) return false
  return true
}).sort((a, b) => b.date.localeCompare(a.date))

/** Logements (hors bureaux) sans constat récent, avec la date du dernier constat. */
export const logementsSansConstat = (S: AppState): { l: Logement; last: string | undefined }[] => S.logements.filter(l => l.typo !== 'BUR')
  .map(l => ({ l, last: S.constats.filter(c => c.logementId === l.id).map(c => c.date).sort().pop() }))
  .filter(x => !x.last || diffDays(x.last, TODAY) > SANS_CONSTAT_JOURS)
