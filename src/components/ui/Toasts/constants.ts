import type { ToastKind } from '@/store/types'

export const TONE: Record<ToastKind, string> = { '': 'bg-ink', ok: 'bg-good', err: 'bg-danger' }
