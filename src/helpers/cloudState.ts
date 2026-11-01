/* Découpage de l'état de l'application en documents Firestore (logique pure, sans accès réseau). */
import type { AppState } from '@/types'
import { emptyRef } from './emptyState'

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

const isLocal = (v: unknown): v is string => typeof v === 'string' && v.startsWith('data:')

/** Garde les photos déjà hébergées (URL) et écarte les data-URL locales ; `undefined` si rien à garder. */
const keepHosted = (v: unknown): unknown => {
  if (typeof v === 'string') return isLocal(v) ? undefined : v
  if (Array.isArray(v)) return v.map(keepHosted).filter(x => x !== undefined)
  if (isRec(v)) return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, keepHosted(x) ?? []]))
  return v
}

/** Applique `fn` à chaque chaîne des champs photo, en place. */
export function mapPhotoStrings(v: unknown, fn: (p: string) => string): void {
  if (Array.isArray(v)) { v.forEach(x => mapPhotoStrings(x, fn)); return }
  if (!isRec(v)) return
  const walk = (x: unknown): unknown => typeof x === 'string' ? fn(x) : Array.isArray(x) ? x.map(walk) : isRec(x) ? Object.fromEntries(Object.entries(x).map(([k, y]) => [k, walk(y)])) : x
  for (const k of Object.keys(v)) { if (k in PHOTO_EMPTY) v[k] = walk(v[k]); else mapPhotoStrings(v[k], fn) }
}

/** Parcourt (sans modifier) chaque chaîne des champs photo. */
export function forEachPhotoString(v: unknown, fn: (p: string) => void): void {
  if (Array.isArray(v)) { v.forEach(x => forEachPhotoString(x, fn)); return }
  if (!isRec(v)) return
  const walk = (x: unknown): void => { if (typeof x === 'string') fn(x); else if (Array.isArray(x)) x.forEach(walk); else if (isRec(x)) Object.values(x).forEach(walk) }
  for (const [k, x] of Object.entries(v)) { if (k in PHOTO_EMPTY) walk(x); else forEachPhotoString(x, fn) }
}

const strip = (v: unknown): unknown => {
  if (Array.isArray(v)) return v.map(strip)
  if (!isRec(v)) return v
  const o: Rec = {}
  for (const [k, x] of Object.entries(v)) o[k] = k in PHOTO_EMPTY ? keepHosted(x) ?? PHOTO_EMPTY[k]() : strip(x)
  return o
}

/** JSON à clés triées : comparaison fiable quel que soit l'ordre des champs renvoyé par Firestore. */
export const canon = (v: unknown): string => {
  if (Array.isArray(v)) return '[' + v.map(canon).join(',') + ']'
  if (isRec(v)) return '{' + Object.keys(v).filter(k => v[k] !== undefined).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}'
  return JSON.stringify(v) ?? 'null'
}

/** Retire les champs de synchronisation (`updatedAt`, `deleted`) : ils ne font pas partie des données de l'application. */
export const stripMeta = (d: Rec): Rec => Object.fromEntries(Object.entries(d).filter(([k]) => k !== 'updatedAt' && k !== 'deleted'))

/** Champs de premier niveau modifiés localement depuis `base` (dernière version connue de la base). */
export const dirtyFields = (local: Rec, base: Rec | undefined): string[] => {
  if (!base) return []
  const l = strip(local) as Rec
  return Object.keys(l).filter(k => k !== '_i' && canon(l[k]) !== canon(base[k]))
}

/** Fusion à trois voies : on prend la version de la base, mais on garde les champs que l'utilisateur vient de modifier
 *  et qui ne sont pas encore partis (sinon une mise à jour d'un autre champ par un collègue les écraserait). */
export function mergeRemote(remote: Rec, local: Rec | undefined, base: Rec | undefined): Rec {
  if (!local || !base) return remote
  const out: Rec = { ...remote }
  for (const k of dirtyFields(local, base)) out[k] = local[k]
  return out
}

/** Différence entre deux versions JSON d'un document : champs de premier niveau changés, et champs disparus. */
export function diffFields(prevJson: string, nextJson: string): { changed: Rec; removed: string[] } {
  const prev = JSON.parse(prevJson) as Rec
  const next = JSON.parse(nextJson) as Rec
  const changed: Rec = {}
  for (const k of Object.keys(next)) if (canon(next[k]) !== canon(prev[k])) changed[k] = next[k]
  return { changed, removed: Object.keys(prev).filter(k => !(k in next)) }
}

/** Clés d'ordre des éléments de liste : chemin (`col/id`) → clé. Une clé est attribuée une fois, à la création du document. */
export type OrderMap = Map<string, number>

/** Complète les clés manquantes (`undefined`) d'après leurs voisines : un nouvel élément en tête reçoit une clé plus petite,
 *  en queue plus grande, au milieu une valeur intermédiaire. Les clés déjà attribuées ne changent jamais, donc insérer en tête
 *  n'oblige plus à réécrire tous les autres documents. */
export function fillOrder(keys: (number | undefined)[]): number[] {
  const out = [...keys]
  for (let i = 0; i < out.length;) {
    if (out[i] !== undefined) { i++; continue }
    let j = i
    while (j < out.length && out[j] === undefined) j++
    const run = j - i
    const prev = i > 0 ? out[i - 1] : undefined
    const next = j < out.length ? out[j] : undefined
    for (let t = 0; t < run; t++) {
      out[i + t] = prev === undefined && next === undefined ? t
        : prev === undefined ? (next as number) - run + t
        : next === undefined ? prev + 1 + t
        : prev + ((next - prev) * (t + 1)) / (run + 1)
    }
    i = j
  }
  return out as number[]
}

/** Documents (chemin → JSON canonique) correspondant à l'état partagé. La clé `_i` conserve l'ordre des listes ;
 *  `order` est complété pour les nouveaux éléments (les clés existantes sont conservées). */
export function toDocs(S: AppState, order: OrderMap): Map<string, string> {
  const m = new Map<string, string>()
  m.set('ref/main', canon(strip(S.ref)))
  m.set('meta/main', canon({ histoMois: S.histoMois, seq: S.seq }))
  for (const col of ITEM_COLS) {
    const list = listOf(S, col)
    const keys = fillOrder(list.map(it => order.get(`${col}/${it.id}`)))
    list.forEach((it, i) => {
      const path = `${col}/${it.id}`
      order.set(path, keys[i])
      m.set(path, canon({ ...(strip(it) as Rec), _i: keys[i] }))
    })
  }
  return m
}

type Item = { id: string }
/** Liste d'éléments d'une collection (tous ont un `id`). */
const listOf = (s: AppState, col: ItemCol): Item[] => s[col]
/** Remplace la liste d'une collection : seul endroit où TypeScript ne peut pas relier `col` au type de sa liste. */
const setList = (s: AppState, col: ItemCol, list: Item[]): void => { (s as Record<ItemCol, Item[]>)[col] = list }

const isEmpty = (v: unknown) => v === undefined || v === '' || (Array.isArray(v) ? v.length === 0 : isRec(v) && Object.keys(v).length === 0)

/** Fusionne dans `t` les data-URL locales de `s` (photos pas encore envoyées) ; les URL hébergées viennent de la base. */
const mergeLocal = (t: unknown, s: unknown): unknown => {
  if (typeof s === 'string') return isLocal(s) && isEmpty(t) ? s : t
  if (Array.isArray(s)) {
    const add = s.filter(x => isLocal(x) && !(Array.isArray(t) && t.includes(x)))
    if (!add.length) return t
    return Array.isArray(t) ? [...t, ...add] : add
  }
  if (isRec(s)) {
    const o: Rec = isRec(t) ? t : {}
    for (const k of Object.keys(s)) { const m = mergeLocal(o[k], s[k]); if (m !== undefined) o[k] = m }
    return isRec(t) || Object.keys(o).length ? o : t
  }
  return t
}

/** Recopie dans `target` les photos locales de `source` non encore envoyées à Cloudinary. */
export function graftPhotos(target: unknown, source: unknown): void {
  if (!isRec(target) || !isRec(source)) return
  for (const k of Object.keys(source)) {
    if (k in PHOTO_EMPTY) { const m = mergeLocal(target[k], source[k]); if (m !== undefined) target[k] = m }
    else graftPhotos(target[k], source[k])
  }
}

/** Applique un document distant (ajout/modification) à l'état. `keyOf` donne la clé d'ordre d'un élément déjà présent. */
export function upsertDoc(s: AppState, col: string, data: Rec, keyOf: (id: string) => number | undefined = () => undefined, base?: Rec): void {
  const { _i, ...remote } = data
  const baseItem = base ? Object.fromEntries(Object.entries(base).filter(([k]) => k !== '_i')) : undefined
  if (col === 'ref') { const item = mergeRemote(remote, s.ref as Rec, baseItem); graftPhotos(item, s.ref); s.ref = { ...emptyRef(), ...item } as AppState['ref']; return }
  const item = remote
  if (col === 'meta') { if (isRec(item.histoMois)) s.histoMois = item.histoMois as AppState['histoMois']; if (isRec(item.seq)) s.seq = item.seq as AppState['seq']; return }
  if (!(ITEM_COLS as readonly string[]).includes(col)) return
  const arr = listOf(s, col as ItemCol)
  const idx = arr.findIndex(x => x.id === item.id)
  if (idx >= 0) { const merged = mergeRemote(item, arr[idx] as Rec, baseItem); graftPhotos(merged, arr[idx]); arr[idx] = merged as Item }
  else {
    // insertion avant le premier élément de clé supérieure (en queue si la clé est inconnue)
    const pos = typeof _i === 'number' ? arr.findIndex(x => (keyOf(x.id) ?? -Infinity) > _i) : -1
    arr.splice(pos < 0 ? arr.length : pos, 0, item as Item)
  }
}

export function removeDoc(s: AppState, col: string, id: string): void {
  if (!(ITEM_COLS as readonly string[]).includes(col)) return
  setList(s, col as ItemCol, listOf(s, col as ItemCol).filter(x => x.id !== id))
}

/** Retire de l'état les éléments absents de la base (premier chargement). */
export function pruneTo(s: AppState, known: (path: string) => boolean): void {
  for (const col of ITEM_COLS) {
    setList(s, col, listOf(s, col).filter(x => known(`${col}/${x.id}`)))
  }
}
