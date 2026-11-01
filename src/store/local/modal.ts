/* Modale ouverte : hors de Redux car son contenu est du JSX (non sérialisable). Le hook `useModal` est dans hooks/. */
import type { ModalSpec } from '@/store/types'

let current: ModalSpec | null = null
const listeners = new Set<() => void>()
const emit = () => listeners.forEach(l => l())
export const subscribeModal = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } }

export const openModal = (spec: ModalSpec): void => { current = spec; emit() }
export const closeModal = (): void => { if (current) { current = null; emit() } }
export const getModal = (): ModalSpec | null => current
