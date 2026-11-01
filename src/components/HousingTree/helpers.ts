import type { Logement } from '@/types'
import { pad, slug } from '@/helpers/dates'

export const logFolder = (l: Logement) => `${l.id}_${slug(l.adresse)}${l.apt ? `_Apt-${l.bat || ''}${pad(Number(l.apt))}` : ''}`
