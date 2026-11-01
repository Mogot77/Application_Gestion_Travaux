import type { AppState, Constat, Logement } from '@/types'
import { getLog, profilOf, uniqueEtabs } from '@/helpers/domain'
import { TODAY, diffDays } from '@/helpers/dates'
import { isAlert } from '@/components/InspectionsTable/helpers'
import { SANS_CONSTAT_JOURS } from './constants'
import type { ConstatsFilters, InspectionsFilter, InspectionsModel, InspectionsWithout } from './types'

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
export const logementsSansConstat = (S: AppState): InspectionsWithout[] => S.logements.filter((l: Logement) => l.typo !== 'BUR')
  .map(l => ({ l, last: S.constats.filter(c => c.logementId === l.id).map(c => c.date).sort().pop() }))
  .filter(x => !x.last || diffDays(x.last, TODAY) > SANS_CONSTAT_JOURS)

/** Libellés et options des listes de filtre ; le filtre « Établissement » n'existe pas pour un profil établissement. */
const buildFilters = (S: AppState): InspectionsFilter[] => {
  const filters: InspectionsFilter[] = [
    { k: 'prop', label: 'Propreté (0 à 6)', options: [0, 1, 2, 3, 4, 5].map(n => ({ v: n, l: `Propreté ≤ ${n}` })) },
    { k: 'bati', label: 'État du bâti', options: ['Bon', 'Moyen', 'Dégradé'] },
    { k: 'sig', label: 'Signalements', options: Object.values(S.ref.signalements).flat() },
    { k: 'ctx', label: 'Contexte', options: S.ref.contextes },
  ]
  if (S.profil !== 'etab') filters.push({ k: 'etab', label: 'Établissement', options: uniqueEtabs(S) })
  filters.push({ k: 'per', label: 'Période : tout', options: [{ v: '30', l: 'Période : 30 jours' }, { v: '90', l: 'Période : 90 jours' }, { v: '365', l: 'Période : 12 mois' }] })
  return filters
}

/** Données d'affichage de l'écran : filtres, lignes du tableau, chiffres du mois et logements sans constat récent. */
export const buildInspectionsModel = (S: AppState, ui: ConstatsFilters): InspectionsModel => {
  const month = S.constats.filter(c => c.date.slice(0, 7) === TODAY.slice(0, 7))
  return {
    filters: buildFilters(S),
    values: ui,
    rows: filterConstats(S, ui).map(c => ({ c, logement: getLog(S, c.logementId), alert: isAlert(c) })),
    month: {
      total: month.length,
      low: month.filter(c => c.proprete <= 2).length,
      demandes: month.filter(c => c.demandeId).length,
      alertes: month.filter(c => c.signalements.some(s => /Chauffage d'appoint|électrique|Détecteur/.test(s))).length,
    },
    sans: logementsSansConstat(S),
  }
}
