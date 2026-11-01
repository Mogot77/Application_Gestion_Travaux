import type { ToastKind } from '@/store/types'

export type ToastItem = { id: number; msg: string; kind: ToastKind }

export type ToastsProps = { items: ToastItem[] }
