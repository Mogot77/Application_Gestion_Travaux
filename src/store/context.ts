import type { ReactNode } from 'react'
import type { AppState } from '@/types'

export type ToastKind = '' | 'ok' | 'err'

export type ModalSpec = {
  title: string
  body: ReactNode
  okLabel?: string
  /** Retourner `false` pour garder la modale ouverte. */
  onOk?: (fd: FormData, form: HTMLFormElement) => boolean | void
  wide?: boolean
  danger?: boolean
  noFooter?: boolean
}

/** API exposée aux écrans par `useApp()` (façade sur le store Redux). */
export type AppCtx = {
  /** État courant (immuable : chaque modification produit une nouvelle référence). */
  S: AppState
  /** Applique une modification (en mutant l'état reçu) puis persiste (immédiatement avec `now`, sinon avec un léger délai). */
  mutate: (fn: (s: AppState) => void, opts?: { now?: boolean }) => void
  /** Dernière version de l'état, y compris après un `mutate` dans le même gestionnaire. */
  getS: () => AppState
  reset: () => void
  toast: (msg: string, kind?: ToastKind) => void
  openModal: (spec: ModalSpec) => void
  closeModal: () => void
}
