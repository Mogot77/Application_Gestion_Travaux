import type { AppState } from '@/types'
import { emptyRef, emptyState } from '@/helpers/emptyState'

/** Même clé et même format que l'ancienne version : les données existantes restent lisibles. */
export const KEY = 'equalis-travaux-v2'

/** Cache local (ou état vide si rien d'exploitable) : état de départ avant l'arrivée des données Firestore. */
export const loadState = (): AppState => {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null') as AppState | null
    if (s && s.v === 1) return { ...s, ref: { ...emptyRef(), ...s.ref } }
  } catch { /* stockage indisponible ou corrompu : on repart d'un état vide */ }
  return emptyState()
}

/** Écrit le cache ; `false` si le stockage est plein ou indisponible. */
export const saveState = (s: AppState): boolean => {
  try { localStorage.setItem(KEY, JSON.stringify(s)); return true } catch { return false }
}

export const clearState = (): void => {
  try { localStorage.removeItem(KEY) } catch { /* ignoré */ }
}
