import { clearState } from '@/store/queries/localCache'
import { clearSync } from '@/store/queries/syncCursor'
import { clearUi } from '@/store/local/uiState'
import type { AppThunk } from './types'

/** Vide le cache local (données, curseur de synchro et état d'interface) puis recharge : tout est relu depuis Firestore. */
export const resetLocal = (): AppThunk => () => {
  clearState()
  clearSync()
  clearUi()
  location.reload()
}
