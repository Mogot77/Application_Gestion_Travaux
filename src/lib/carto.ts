/* Calculs cartographiques et fragments HTML des repères Leaflet */
import type { AppState, Logement } from '../types'
import { VILLES } from '../data/refs'
import { esc } from './dates'
import { getLog } from './domain'

export type LatLng = [number, number]

export const DEPOT: LatLng = [48.5265, 2.676]   // dépôt du service technique, Vaux-le-Pénil
export const BUREAU: LatLng = [48.9585, 2.88]   // bureau de Meaux
export const CENTRE: LatLng = [48.72, 2.6]

export const approx = (l?: Logement) => !l || l.lat == null || l.lng == null

export const posLog = (S: AppState, id: string | Logement): LatLng => {
  const l = typeof id === 'object' ? id : getLog(S, id)
  if (l && !approx(l)) return [l.lat as number, l.lng as number]
  const base = (l && VILLES[l.ville]) || DEPOT
  // pas de géocodage : centre de la commune, légèrement décalé (stable) pour séparer les repères voisins
  const h = [...(l ? l.id : 'x')].reduce((s, c) => s + c.charCodeAt(0) * 7, 0)
  return [base[0] + ((h % 9) - 4) * 0.0035, base[1] + (((h >> 3) % 9) - 4) * 0.0045]
}
export const km = (a: LatLng, b: LatLng) => { // distance à vol d'oiseau × 1,3 ≈ distance routière
  const r = Math.PI / 180, dLa = (b[0] - a[0]) * r, dLo = (b[1] - a[1]) * r
  const x = Math.sin(dLa / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLo / 2) ** 2
  return 6371 * 2 * Math.asin(Math.sqrt(x)) * 1.3
}
export const tripMin = (k: number) => Math.round(k / 35 * 60 + (k ? 5 : 0))

/** Géocodage d'adresse (Nominatim / OpenStreetMap). */
export const geocode = async (adresse: string, cp: string, ville: string): Promise<LatLng | null> => {
  const q = `${adresse}, ${cp} ${ville}, France`
  const r = await fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=fr&q=' + encodeURIComponent(q), { headers: { Accept: 'application/json' } })
  if (!r.ok) throw new Error('Service de géocodage indisponible')
  const j = await r.json() as { lat: string; lon: string }[]
  return j.length ? [Number(j[0].lat), Number(j[0].lon)] : null
}

export const pinHtml = (label: string, color: string, size = 30) => `<div class="cm-pin" style="background:${color};width:${size}px;height:${size}px">${esc(label)}</div>`
export const avatarHtml = (txt: string, color: string) => `<div class="cm-av" style="background:${color}">${esc(txt)}</div>`
export const baseHtml = (letter: string) => `<div class="cm-base">${esc(letter)}</div>`
