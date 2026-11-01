import type { Logement } from '@/types'
import type { DocFile } from '@/helpers/docs'

export type HousingTreeProps = { l: Logement; open: boolean }

export type HousingTreeFolder = { folder: string; statut: string; files: DocFile[] }

export type HousingTreeViewProps = { folder: string; constats: DocFile[]; demandes: HousingTreeFolder[]; open: boolean }
