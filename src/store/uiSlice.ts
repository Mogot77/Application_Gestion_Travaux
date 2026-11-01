import { createSlice, type PayloadAction, type ThunkAction, type UnknownAction } from '@reduxjs/toolkit'
import type { ToastItem } from '@/components/ui/Toasts'
import type { ToastKind } from './context'

export type UiState = {
  toasts: ToastItem[]
  /** Premier jeu de données Firestore reçu. */
  ready: boolean
  syncFailed: boolean
}

const TOAST_MS = 3400

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

let toastSeq = 0

/** Affiche un message temporaire. */
export const toast = (msg: string, kind: ToastKind = ''): ThunkAction<void, unknown, unknown, UnknownAction> => dispatch => {
  const id = ++toastSeq
  dispatch(toastAdded({ id, msg, kind }))
  window.setTimeout(() => dispatch(toastRemoved(id)), TOAST_MS)
}
