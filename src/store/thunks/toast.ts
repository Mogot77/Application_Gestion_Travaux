import { toastAdded, toastRemoved } from '@/store/reducers'
import type { ToastKind } from '@/store/types'
import type { AppThunk } from './types'

const TOAST_MS = 3400
let toastSeq = 0

/** Affiche un message temporaire. */
export const toast = (msg: string, kind: ToastKind = ''): AppThunk => dispatch => {
  const id = ++toastSeq
  dispatch(toastAdded({ id, msg, kind }))
  window.setTimeout(() => dispatch(toastRemoved(id)), TOAST_MS)
}
