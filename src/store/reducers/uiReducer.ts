import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { ToastItem } from '@/components/ui/Toasts'

export type UiState = {
  toasts: ToastItem[]
  /** Premier jeu de données Firestore reçu. */
  ready: boolean
  syncFailed: boolean
}

const uiSlice = createSlice({
  name: 'ui',
  initialState: { toasts: [], ready: false, syncFailed: false } as UiState,
  reducers: {
    toastAdded: (s, a: PayloadAction<ToastItem>) => { s.toasts.push(a.payload) },
    toastRemoved: (s, a: PayloadAction<number>) => { s.toasts = s.toasts.filter(t => t.id !== a.payload) },
    readySet: (s, a: PayloadAction<boolean>) => { s.ready = a.payload },
    syncFailedSet: (s, a: PayloadAction<boolean>) => { s.syncFailed = a.payload },
  },
})

export const { toastAdded, toastRemoved, readySet, syncFailedSet } = uiSlice.actions
export default uiSlice.reducer
