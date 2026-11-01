import type { DocFile } from '@/helpers/docs'
import type { HousingTreeViewProps } from '@/components/HousingTree'

export type DocumentsProps = Record<string, never>

export type ClassementRule = [string, string, string?]

export type ClassementView = [string, string]

/** Filtre de la vue SharePoint (`v` vide = tous les fichiers). */
export type DocumentsUi = { v: string }

export type DocumentsCity = { ville: string; count: number; trees: HousingTreeViewProps[] }

export type DocumentsDept = { dept: string; villes: DocumentsCity[] }

export type DocumentsModel = { depts: DocumentsDept[]; files: DocFile[]; view: string }

export type DocumentsViewProps = { model: DocumentsModel; onView: (v: string) => void }
