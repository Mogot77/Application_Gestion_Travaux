import type { Demande, Rdv } from '@/types'
import type { PlanUi } from '@/helpers/planning'

export type SetUi = (p: Partial<PlanUi>) => void

export type LoadBarProps = { min: number; max?: number }

export type CardTagProps = { d: Demande }

export type PlanPanelProps = { d: Demande; ui: PlanUi; setUi: SetUi }

export type AppointmentPanelProps = { r: Rdv; setUi: SetUi }
