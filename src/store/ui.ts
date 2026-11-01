/* État d'interface partagé entre les écrans (filtres, onglets, brouillons non persistés) : survit à la navigation, pas au rechargement. */
import { useCallback, useSyncExternalStore } from 'react'

const store = new Map<string, unknown>()
const listeners = new Set<() => void>()
const emit = () => listeners.forEach(l => l())
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } }

export const clearUi = () => { store.clear(); emit() }
export const getUi = <T extends object>(key: string, initial: T): T => {
  if (!store.has(key)) store.set(key, initial)
  return store.get(key) as T
}
export const patchUi = <T extends object>(key: string, initial: T, patch: Partial<T> | ((cur: T) => Partial<T>)) => {
  const cur = getUi(key, initial)
  store.set(key, { ...cur, ...(typeof patch === 'function' ? patch(cur) : patch) })
  emit()
}
/** Remplace entièrement la valeur (ou la supprime avec `null`, pour repartir de la valeur initiale). */
export const setUi = <T extends object>(key: string, value: T | null) => {
  if (value === null) store.delete(key); else store.set(key, value)
  emit()
}

export function useUiState<T extends object>(key: string, initial: T): [T, (patch: Partial<T> | ((cur: T) => Partial<T>)) => void] {
  const value = useSyncExternalStore(subscribe, () => getUi(key, initial), () => getUi(key, initial))
  const set = useCallback((patch: Partial<T> | ((cur: T) => Partial<T>)) => patchUi(key, initial, patch), [key, initial])
  return [value, set]
}
