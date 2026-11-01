import type { Demande } from '@/types'
import { CLOSED, QUALIF } from '@/helpers/domain'
import type { DemUi, TabKey } from './types'

export const TABS: [TabKey, string, (d: Demande) => boolean][] = [
  ['toutes', 'Toutes', () => true],
  ['a_traiter', 'À traiter', d => !CLOSED.includes(d.statut)],
  ['a_qualifier', 'À qualifier', d => QUALIF.includes(d.statut)],
  ['a_planifier', 'À planifier', d => ['a_planifier', 'acces_impossible'].includes(d.statut)],
  ['occupants', "Demandes d'occupants", d => d.origine === 'occupant' && !CLOSED.includes(d.statut)],
  ['a_reactualiser', 'À réactualiser', d => d.statut === 'a_reactualiser'],
  ['cloturees', 'Clôturées', d => CLOSED.includes(d.statut)],
]
export const PER_PAGE = 12



export const INIT: DemUi = { tab: 'a_traiter', q: '', etab: '', dept: '', lot: '', urgence: '', circuit: '', statut: '', page: 0, sel: [] }

export const ORIGINE_LABEL: Record<string, string> = { occupant: "déposée par l'occupant", mail: 'reçue par mail', tel: 'reçue par téléphone' }
