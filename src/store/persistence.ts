import type { AppState } from '@/types'
import { seed } from '@/data/seed'

/** Même clé et même format que l'ancienne version : les données existantes restent lisibles. */
export const KEY = 'equalis-travaux-v2'

/** Cache local (ou jeu de démo si rien d'exploitable) : état de départ avant l'arrivée des données Firestore. */
export const loadState = (): AppState => {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null') as AppState | null
    if (s && s.v === 1) return s
  } catch { /* stockage indisponible : on repart des données de démo */ }
  const fresh = seed()
  try { localStorage.setItem(KEY, JSON.stringify(fresh)) } catch { /* stockage indisponible */ }
  return fresh
}
