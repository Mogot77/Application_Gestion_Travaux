import type { AppState, Ouvrier } from '@/types'

export type WorkersProps = Record<string, never>

export type OuvrierStats = { total: number; week: number; avenir: number }

export type ColorPickerProps = { initial: string }

export type WorkerFormProps = { S: AppState; o: Partial<Ouvrier> }
