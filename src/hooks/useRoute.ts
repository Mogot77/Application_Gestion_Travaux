import { useSyncExternalStore } from 'react'

const subscribe = (cb: () => void) => { window.addEventListener('hashchange', cb); return () => window.removeEventListener('hashchange', cb) }
const snapshot = () => location.hash

export interface Route { path: string; query: Record<string, string> }

/** Route courante (routage par hash, comme l'ancienne version). */
export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, snapshot, snapshot)
  const raw = (hash || '#/demandes').slice(1)
  const [path, qs] = raw.split('?')
  return { path, query: Object.fromEntries(new URLSearchParams(qs || '')) }
}

export const go = (hash: string) => { location.hash = hash }
export const replace = (hash: string) => { location.replace(hash) }
