import type { Demande, Logement } from '@/types'

export type LogTab = 'synthese' | 'inter' | 'constats' | 'docs'

export type LogUi = { q: string; dept: string; typo: string; etab: string; tab: LogTab; tabFor: string }

export type HousingProps = { id?: string }

export type InterventionsTableProps = { ds: Demande[] }

export type LocationCardProps = { sel: Logement }
