import { useCallback, useSyncExternalStore } from 'react'
import { getUi, patchUi, subscribeUi } from '@/helpers/uiState'

/** État d'interface persistant (filtres, onglets, brouillons) lié à une clé : survit à la navigation et au rechargement. */
export const useUiState = <T extends object>(key: string, initial: T): [T, (patch: Partial<T> | ((cur: T) => Partial<T>)) => void] => {
  const value = useSyncExternalStore(subscribeUi, () => getUi(key, initial), () => getUi(key, initial))
  const set = useCallback((patch: Partial<T> | ((cur: T) => Partial<T>)) => patchUi(key, initial, patch), [key, initial])
  return [value, set]
}
