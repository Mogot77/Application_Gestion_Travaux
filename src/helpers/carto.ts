/* Calculs cartographiques et fragments HTML des repères Leaflet */
import type { AppState, Logement } from '../types'
import { VILLES } from '../data/refs'
import { esc } from './dates'
import { getLog } from './domain'

export type LatLng = [number, number]

export const DEPOT: LatLng = [48.5265, 2.676]   // dépôt du service technique, Vaux-le-Pénil

export const approx = (l?: Logement) => !l || l.lat == null || l.lng == null

export const posLog = (S: AppState, id: string | Logement): LatLng => {
  const l = typeof id === 'object' ? id : getLog(S, id)
  if (l && !approx(l)) return [l.lat as number, l.lng as number]
  const base = (l && VILLES[l.ville]) || DEPOT
  // pas de géocodage : centre de la commune, légèrement décalé (stable) pour séparer les repères voisins
  const h = [...(l ? l.id : 'x')].reduce((s, c) => s + c.charCodeAt(0) * 7, 0)
  return [base[0] + ((h % 9) - 4) * 0.0035, base[1] + (((h >> 3) % 9) - 4) * 0.0045]
}

export const pinHtml = (label: string, color: string, size = 30) => `<div class="cm-pin" style="background:${color};width:${size}px;height:${size}px">${esc(label)}</div>`
export const baseHtml = (letter: string) => `<div class="cm-base">${esc(letter)}</div>`
