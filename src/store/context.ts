import { createContext, type ReactNode } from 'react'
import type { AppState } from '../types'

export type ToastKind = '' | 'ok' | 'err'

export interface ModalSpec {
  title: string
  body: ReactNode
  okLabel?: string
  /** Retourner `false` pour garder la modale ouverte. */
  onOk?: (fd: FormData, form: HTMLFormElement) => boolean | void
  wide?: boolean
  danger?: boolean
  noFooter?: boolean
}

export interface AppCtx {
  /** État courant (immuable : chaque modification produit une nouvelle référence). */
  S: AppState
  /** Applique une modification sur une copie de l'état puis persiste (immédiatement avec `now`, sinon avec un léger délai). */
  mutate: (fn: (s: AppState) => void, opts?: { now?: boolean }) => void
  /** Dernière version de l'état, y compris après un `mutate` dans le même gestionnaire. */
  getS: () => AppState
  reset: () => void
  toast: (msg: string, kind?: ToastKind) => void
  openModal: (spec: ModalSpec) => void
  closeModal: () => void
}

export const AppContext = createContext<AppCtx | null>(null)
