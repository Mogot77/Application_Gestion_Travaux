/* Découpage de l'état de l'application en documents Firestore (logique pure, sans accès réseau). */
import type { AppState } from '../types'

/** Collections dont chaque élément (champ `id`) devient un document. */
export const ITEM_COLS = ['logements', 'ouvriers', 'entreprises', 'demandes', 'rdvs', 'constats', 'consultations'] as const
export type ItemCol = (typeof ITEM_COLS)[number]
/** Collections à document unique `main`. */
export const SINGLE_COLS = ['ref', 'meta'] as const
export const ALL_COLS: readonly string[] = [...SINGLE_COLS, ...ITEM_COLS]

type Rec = Record<string, unknown>
const isRec = (v: unknown): v is Rec => typeof v === 'object' && v !== null

/** Champs contenant des photos : ils ne sont jamais envoyés à Firestore. */
const PHOTO_EMPTY: Record<string, () => unknown> = {
  photos: () => [], photosApres: () => [], photo: () => '', photoImp: () => '', apres: () => ({}),
}

const strip = (v: unknown): unknown => {
  if (Array.isArray(v)) return v.map(strip)
  if (!isRec(v)) return v
  const o: Rec = {}
  for (const [k, x] of Object.entries(v)) o[k] = k in PHOTO_EMPTY ? PHOTO_EMPTY[k]() : strip(x)
  return o
}

/** JSON à clés triées : comparaison fiable quel que soit l'ordre des champs renvoyé par Firestore. */
export const canon = (v: unknown): string => {
  if (Array.isArray(v)) return '[' + v.map(canon).join(',') + ']'
  if (isRec(v)) return '{' + Object.keys(v).filter(k => v[k] !== undefined).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}'
  return JSON.stringify(v) ?? 'null'
}

/** Documents (chemin → JSON canonique) correspondant à l'état partagé. L'index `_i` conserve l'ordre des listes. */
export function toDocs(S: AppState): Map<string, string> {
  const m = new Map<string, string>()
  m.set('ref/main', canon(strip(S.ref)))
  m.set('meta/main', canon({ histoMois: S.histoMois, seq: S.seq }))
  for (const col of ITEM_COLS) {
    (S[col] as { id: string }[]).forEach((it, i) => m.set(`${col}/${it.id}`, canon({ ...(strip(it) as Rec), _i: i })))
  }
  return m
}

const isEmpty = (v: unknown) => v === undefined || v === '' || (Array.isArray(v) ? v.length === 0 : isRec(v) && Object.keys(v).length === 0)

/** Recopie dans `target` les photos de `source` (les photos restent locales à l'appareil). */
export function graftPhotos(target: unknown, source: unknown): void {
  if (!isRec(target) || !isRec(source)) return
  for (const k of Object.keys(source)) {
    if (k in PHOTO_EMPTY) { if (isEmpty(target[k]) && !isEmpty(source[k])) target[k] = source[k] }
    else graftPhotos(target[k], source[k])
  }
}

/** Applique un document distant (ajout/modification) à l'état. */
export function upsertDoc(s: AppState, col: string, data: Rec): void {
  const { _i, ...item } = data
  if (col === 'ref') { graftPhotos(item, s.ref); s.ref = item as unknown as AppState['ref']; return }
  if (col === 'meta') { if (isRec(item.histoMois)) s.histoMois = item.histoMois as AppState['histoMois']; if (isRec(item.seq)) s.seq = item.seq as AppState['seq']; return }
  if (!(ITEM_COLS as readonly string[]).includes(col)) return
  const arr = s[col as ItemCol] as unknown as { id: string }[]
  const idx = arr.findIndex(x => x.id === item.id)
  if (idx >= 0) { graftPhotos(item, arr[idx]); arr[idx] = item as unknown as { id: string } }
  else arr.splice(Math.min(typeof _i === 'number' ? _i : arr.length, arr.length), 0, item as unknown as { id: string })
}

export function removeDoc(s: AppState, col: string, id: string): void {
  if (!(ITEM_COLS as readonly string[]).includes(col)) return
  const key = col as ItemCol
  ;(s[key] as unknown as { id: string }[]) = (s[key] as unknown as { id: string }[]).filter(x => x.id !== id)
}

/** Retire de l'état les éléments absents de la base (premier chargement). */
export function pruneTo(s: AppState, known: (path: string) => boolean): void {
  for (const col of ITEM_COLS) {
    (s[col] as unknown as { id: string }[]) = (s[col] as unknown as { id: string }[]).filter(x => known(`${col}/${x.id}`))
  }
}
