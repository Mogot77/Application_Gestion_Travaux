import { TODAY } from '@/helpers/dates'
import type { TbUi } from './types'

export const MOIS_C = ['Janv.', 'Févr.', 'Mars', 'Avr.', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.']

export const INIT: TbUi = { mois: TODAY.slice(0, 7), dept: '', etab: '' }
