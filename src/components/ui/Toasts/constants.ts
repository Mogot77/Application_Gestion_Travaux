import type { ToastKind } from '@/store/types'

export const TONE: Record<ToastKind, string> = { '': 'bg-nav', ok: 'bg-good', err: 'bg-danger' }
