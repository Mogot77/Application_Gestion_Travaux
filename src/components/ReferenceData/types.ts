import type { Referentiels as Ref } from '@/types'

export type ReferenceDataProps = Record<string, never>

export type ListKey = { [K in keyof Ref]: Ref[K] extends string[] ? K : never }[keyof Ref]
export type GroupKey = { [K in keyof Ref]: Ref[K] extends Record<string, string[]> ? K : never }[keyof Ref]
export type ObjKey = 'urgences' | 'circuits'

export type ListDef = [ListKey, string, string, 'list'] | [ObjKey, string, string, 'obj'] | [GroupKey, string, string, 'group']

export type Target = { key: ListKey | GroupKey; group?: string }

export type ChipsProps = { arr: string[]; target: Target; can: boolean }

export type AdderProps = { arr: string[]; target: Target }
