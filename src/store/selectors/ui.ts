import type { RootState } from '@/store/reducers'

export const selectReady = (s: RootState) => s.ui.ready
export const selectSyncFailed = (s: RootState) => s.ui.syncFailed
export const selectToasts = (s: RootState) => s.ui.toasts
