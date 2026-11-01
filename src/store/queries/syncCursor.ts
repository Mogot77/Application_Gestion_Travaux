/* Curseur de synchronisation incrémentale : jusqu'où ce navigateur a déjà lu Firestore.
   Il va avec le cache local des données (localCache.ts) : si l'un est effacé, l'autre doit l'être aussi. */

const KEY = 'equalis-travaux-sync-v1'

/** Au-delà de cette durée, on refait une lecture complète (rattrape les écritures d'un ancien client et les suppressions manquées). */
export const FULL_SYNC_MAX_AGE_MS = 24 * 60 * 60 * 1000

/** Dernier `updatedAt` serveur lu : [secondes, nanosecondes]. */
export type Cursor = [number, number]

export type SavedSync = {
  v: 1
  /** Date (ms) de la dernière lecture complète. */
  fullAt: number
  /** Curseur par collection. */
  cursors: Record<string, Cursor>
  /** Clés d'ordre des documents (chemin → clé), nécessaires pour insérer sans tout réécrire. */
  order: Record<string, number>
}

export const loadSync = (): SavedSync | null => {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null') as SavedSync | null
    return s && s.v === 1 ? s : null
  } catch { return null }
}

export const saveSync = (s: SavedSync): void => {
  try { localStorage.setItem(KEY, JSON.stringify(s)) } catch { /* stockage plein : la prochaine ouverture fera une lecture complète */ }
}

/** Oublie le curseur : la prochaine ouverture relit tout. */
export const clearSync = (): void => {
  try { localStorage.removeItem(KEY) } catch { /* ignoré */ }
}

/** Une lecture incrémentale n'est possible que si le curseur est récent et complet. */
export const canResume = (s: SavedSync | null, now = Date.now()): s is SavedSync =>
  !!s && now - s.fullAt < FULL_SYNC_MAX_AGE_MS && Object.keys(s.order).length > 0

/** `true` si `a` est strictement plus récent que `b`. */
export const newer = (a: Cursor, b: Cursor): boolean => a[0] > b[0] || (a[0] === b[0] && a[1] > b[1])
