import type { Consultation, ReponseDevis } from '@/types'

export type Invitation = { cs: Consultation; rep: ReponseDevis; closed: boolean }

export type EntStats = { invitations: Invitation[]; recus: number; attente: number; declines: number; retenus: number; docsOk: boolean }
