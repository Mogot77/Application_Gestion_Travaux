import type { ToastKind } from '@/store/context'

export const TONE: Record<ToastKind, string> = { '': 'bg-ink', ok: 'bg-good', err: 'bg-danger' }
