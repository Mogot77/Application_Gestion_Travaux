import type { AppState, Logement } from '@/types'
import { CLOSED, QUALIF } from '@/helpers/domain'
import { fd } from '@/helpers/dates'
import type { LatLng } from '@/helpers/carto'

/** Géocodage d'adresse (Nominatim / OpenStreetMap). */
export const geocode = async (adresse: string, cp: string, ville: string): Promise<LatLng | null> => {
  const q = `${adresse}, ${cp} ${ville}, France`
  const r = await fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=fr&q=' + encodeURIComponent(q), { headers: { Accept: 'application/json' } })
  if (!r.ok) throw new Error('Service de géocodage indisponible')
  const j = await r.json() as { lat: string; lon: string }[]
  return j.length ? [Number(j[0].lat), Number(j[0].lon)] : null
}

/** Résumé en une ligne de l'activité en cours sur un logement. */
export const resume = (S: AppState, l: Logement): string => {
  const ds = S.demandes.filter(d => d.logementId === l.id && !CLOSED.includes(d.statut) && d.statut !== 'brouillon')
  const c = S.constats.filter(x => x.logementId === l.id).sort((a, b) => b.date.localeCompare(a.date))[0]
  if (ds.some(d => d.statut === 'en_cours')) return 'intervention en cours'
  if (ds.some(d => d.statut === 'a_reactualiser')) return 'demande à réactualiser'
  if (ds.some(d => QUALIF.includes(d.statut))) return `${ds.length} demande${ds.length > 1 ? 's' : ''} dont à qualifier`
  if (ds.length) return `${ds.length} demande${ds.length > 1 ? 's' : ''} en cours`
  if (c && c.proprete <= 2) return `constat « ${S.ref.proprete[c.proprete].toLowerCase()} » le ${fd(c.date)}`
  return 'aucune demande en cours'
}
