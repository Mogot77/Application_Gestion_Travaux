import type { Referentiels as Ref } from '@/types'

export type ReferenceDataProps = Record<string, never>

export type ListKey = { [K in keyof Ref]-?: Ref[K] extends string[] ? K : never }[keyof Ref]
export type GroupKey = { [K in keyof Ref]-?: Ref[K] extends Record<string, string[]> ? K : never }[keyof Ref]
/** Listes d'objets {k, l, d} : la clé `k` est structurante (le code s'appuie dessus), seuls libellé et description se modifient. */
export type ObjKey = 'urgences' | 'circuits' | 'suitesSupp'
export type RowsKey = 'villes' | 'depts'

export type ListDef = [ListKey, string, string, 'list'] | [ObjKey, string, string, 'obj'] | [GroupKey, string, string, 'group']

export type Target = { key: ListKey | GroupKey; group?: string }

/** Résultat d'une modification : `ok` ou la raison du refus. */
export type EditResult = 'ok' | 'empty' | 'dup' | 'last' | 'invalid'

export type ValueListProps = { arr: string[]; target: Target; can: boolean }
export type GroupListProps = { name: GroupKey; can: boolean }
export type ObjListProps = { name: ObjKey; can: boolean }
export type RowsEditorProps = { name: RowsKey; can: boolean }
