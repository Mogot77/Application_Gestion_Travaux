import type { Referentiels as Ref, Tone } from '@/types'

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

export type ObjEntry = { k: string; l: string; d: string }

/** Section de référentiel déjà calculée : titre, qui renseigne, et valeurs selon le type de liste. */
export type SectionModel =
  | { type: 'list'; k: ListKey; title: string; who: string; values: string[] }
  | { type: 'obj'; k: ObjKey; title: string; who: string; entries: ObjEntry[] }
  | { type: 'group'; k: GroupKey; title: string; who: string; groups: [string, string[]][] }

export type ReferenceDataModel = {
  /** Modification autorisée (lecture seule pour les établissements). */
  can: boolean
  seuils: Ref['seuils']
  sections: SectionModel[]
  /** Villes et départements : [clé, texte affiché]. */
  villes: [string, string][]
  depts: [string, string][]
  proprete: string[]
  statuts: [string, Tone][]
}

/** Callbacks d'édition partagés par les listes (ajout : renvoie true si la valeur est acceptée). */
export type ValueListProps = {
  arr: string[]
  can: boolean
  onAdd: (v: string) => boolean
  onRename: (i: number) => void
  onRemove: (i: number) => void
}
export type GroupListProps = {
  groups: [string, string[]][]
  can: boolean
  onAddGroup: (name: string) => boolean
  onRenameGroup: (name: string) => void
  onRemoveGroup: (name: string) => void
  onAdd: (group: string, v: string) => boolean
  onRename: (group: string, i: number) => void
  onRemove: (group: string, i: number) => void
}
export type ObjListProps = { entries: ObjEntry[]; can: boolean; onEdit: (o: ObjEntry) => void }
export type RowsEditorProps = {
  rows: [string, string][]
  isVille: boolean
  can: boolean
  onEdit: (key: string | null) => void
  onDelete: (key: string) => void
}

export type ReferenceDataViewProps = {
  model: ReferenceDataModel
  onSetSeuil: (k: keyof Ref['seuils'], v: string) => void
  onEditProprete: (i: number) => void
  onAddValue: (target: Target, v: string) => boolean
  onRenameValue: (target: Target, i: number) => void
  onRemoveValue: (target: Target, i: number) => void
  onAddGroup: (name: GroupKey, g: string) => boolean
  onRenameGroup: (name: GroupKey, old: string) => void
  onRemoveGroup: (name: GroupKey, old: string) => void
  onEditObj: (name: ObjKey, o: ObjEntry) => void
  onEditRow: (name: RowsKey, key: string | null) => void
  onDeleteRow: (name: RowsKey, key: string) => void
}
