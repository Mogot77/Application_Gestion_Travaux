import type { AppState, Referentiels as Ref } from '@/types'
import { STAT } from '@/helpers/domain'
import { LISTS } from './constants'
import type { EditResult, GroupKey, ListKey, ObjEntry, ObjKey, ReferenceDataModel, RowsKey, SectionModel, Target } from './types'

export const pick = (r: Ref, t: Target): string[] => t.group ? (r[t.key as GroupKey])[t.group] : r[t.key as ListKey]

/* ---------- listes de valeurs ---------- */
export const addValue = (r: Ref, t: Target, v: string): EditResult => {
  const val = v.trim()
  if (!val) return 'empty'
  const arr = pick(r, t)
  if (arr.includes(val)) return 'dup'
  arr.push(val)
  return 'ok'
}

export const renameValue = (r: Ref, t: Target, i: number, v: string): EditResult => {
  const val = v.trim()
  if (!val) return 'empty'
  const arr = pick(r, t)
  if (arr.some((x, j) => j !== i && x === val)) return 'dup'
  arr[i] = val
  return 'ok'
}

export const removeValue = (r: Ref, t: Target, i: number): EditResult => {
  const arr = pick(r, t)
  if (arr.length <= 1) return 'last'
  arr.splice(i, 1)
  return 'ok'
}

/* ---------- groupes (lots, signalements) ---------- */
export const addGroup = (r: Ref, key: GroupKey, name: string): EditResult => {
  const n = name.trim()
  if (!n) return 'empty'
  if (n in r[key]) return 'dup'
  r[key][n] = []
  return 'ok'
}

/** Renomme un groupe en gardant son rang dans la liste. */
export const renameGroup = (r: Ref, key: GroupKey, old: string, name: string): EditResult => {
  const n = name.trim()
  if (!n) return 'empty'
  if (n !== old && n in r[key]) return 'dup'
  r[key] = Object.fromEntries(Object.entries(r[key]).map(([g, arr]) => [g === old ? n : g, arr]))
  return 'ok'
}

export const removeGroup = (r: Ref, key: GroupKey, name: string): EditResult => {
  if (Object.keys(r[key]).length <= 1) return 'last'
  delete r[key][name]
  return 'ok'
}

/* ---------- listes d'objets {k, l, d} : libellé et description seulement ---------- */
export const setObjEntry = (r: Ref, key: ObjKey, k: string, l: string, d: string): EditResult => {
  const label = l.trim()
  if (!label) return 'empty'
  const o = (r[key] as { k: string; l: string; d: string }[]).find(x => x.k === k)
  if (!o) return 'invalid'
  o.l = label
  o.d = d.trim()
  return 'ok'
}

/* ---------- note de propreté : 7 niveaux (0 à 6), libellés modifiables ---------- */
export const setProprete = (r: Ref, i: number, label: string): EditResult => {
  const v = label.trim()
  if (!v) return 'empty'
  r.proprete[i] = v
  return 'ok'
}

/* ---------- villes (coordonnées) et départements ---------- */
export const setVille = (r: Ref, old: string | null, name: string, lat: string, lng: string): EditResult => {
  const n = name.trim()
  const la = Number(lat.replace(',', '.'))
  const ln = Number(lng.replace(',', '.'))
  if (!n) return 'empty'
  if (!Number.isFinite(la) || !Number.isFinite(ln) || Math.abs(la) > 90 || Math.abs(ln) > 180) return 'invalid'
  if (n !== old && n in r.villes) return 'dup'
  r.villes = Object.fromEntries(old && old in r.villes
    ? Object.entries(r.villes).map(([k, v]) => k === old ? [n, [la, ln]] : [k, v])
    : [...Object.entries(r.villes), [n, [la, ln]]])
  return 'ok'
}

export const setDept = (r: Ref, old: string | null, code: string, label: string): EditResult => {
  const c = code.trim()
  const l = label.trim()
  if (!c || !l) return 'empty'
  if (c !== old && c in r.depts) return 'dup'
  r.depts = Object.fromEntries(old && old in r.depts
    ? Object.entries(r.depts).map(([k, v]) => k === old ? [c, l] : [k, v])
    : [...Object.entries(r.depts), [c, l]])
  return 'ok'
}

export const removeRow = (r: Ref, key: RowsKey, k: string): void => { delete r[key][k] }

/* ---------- modèle de vue ---------- */
/** Sections de listes, villes, départements, propreté et statuts, prêts à afficher. */
export const buildReferenceDataModel = (S: AppState): ReferenceDataModel => {
  const ref = S.ref
  const sections = LISTS.map((def): SectionModel => {
    const [, title, who] = def
    if (def[3] === 'obj') return { type: 'obj', k: def[0], title, who, entries: ref[def[0]] as ObjEntry[] }
    if (def[3] === 'group') return { type: 'group', k: def[0], title, who, groups: Object.entries(ref[def[0]]) }
    return { type: 'list', k: def[0], title, who, values: ref[def[0]] }
  })
  return {
    can: S.profil !== 'etab',
    seuils: ref.seuils,
    sections,
    villes: Object.entries(ref.villes).map(([k, v]): [string, string] => [k, v.join(' ; ')]),
    depts: Object.entries(ref.depts).map(([k, v]): [string, string] => [k, String(v)]),
    proprete: ref.proprete,
    statuts: Object.values(STAT),
  }
}
