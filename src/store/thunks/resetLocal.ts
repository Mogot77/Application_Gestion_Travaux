import { clearState } from '@/store/queries/localCache'
import { clearUi } from '@/store/local/uiState'
import type { AppThunk } from './types'

/** Vide le cache local (données et état d'interface) puis recharge : les données reviennent de Firestore. */
export const resetLocal = (): AppThunk => () => {
  clearState()
  clearUi()
  location.reload()
}
