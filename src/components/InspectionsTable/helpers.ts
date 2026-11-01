import type { Constat } from '@/types'

export const isAlert = (c: Constat) => c.proprete <= 2 || c.signalements.some(s => /Chauffage d'appoint|électrique dangereuse|Détecteur/.test(s))
