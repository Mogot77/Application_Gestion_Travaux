import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { AppState } from '../types'
import { seed } from '../data/seed'
import { AppContext, type AppCtx, type ModalSpec, type ToastKind } from './context'
import { clearUi } from './ui'
import { Modal } from '../components/ui/Modal'
import { Toasts, type ToastItem } from '../components/ui/Toasts'

/** Même clé et même format que l'ancienne version : les données existantes restent lisibles. */
const KEY = 'equalis-travaux-v2'

const load = (): AppState => {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null') as AppState | null
    if (s && s.v === 1) return s
  } catch { /* stockage indisponible : on repart des données de démo */ }
  const fresh = seed()
  try { localStorage.setItem(KEY, JSON.stringify(fresh)) } catch { /* stockage indisponible */ }
  return fresh
}

let toastSeq = 0

export function AppProvider({ children }: { children: ReactNode }) {
  const [S, setS] = useState<AppState>(load)
  const ref = useRef<AppState>(S)
  const timer = useRef<number | undefined>(undefined)
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [modal, setModal] = useState<ModalSpec | null>(null)

  const toast = useCallback((msg: string, kind: ToastKind = '') => {
    const id = ++toastSeq
    setToasts(t => [...t, { id, msg, kind }])
    window.setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3400)
  }, [])

  const saveNow = useCallback(() => {
    window.clearTimeout(timer.current)
    try { localStorage.setItem(KEY, JSON.stringify(ref.current)) }
    catch { toast('Stockage local plein : supprimez des photos ou réinitialisez la démo', 'err') }
  }, [toast])

  const mutate = useCallback<AppCtx['mutate']>((fn, opts) => {
    const next = structuredClone(ref.current)
    fn(next)
    ref.current = next
    setS(next)
    if (opts?.now) saveNow()
    else { window.clearTimeout(timer.current); timer.current = window.setTimeout(saveNow, 250) }
  }, [saveNow])

  const reset = useCallback(() => {
    try { localStorage.removeItem(KEY) } catch { /* ignoré */ }
    clearUi()
    ref.current = seed()
    setS(ref.current)
    saveNow()
  }, [saveNow])

  const closeModal = useCallback(() => setModal(null), [])
  const openModal = useCallback((spec: ModalSpec) => setModal(spec), [])

  useEffect(() => {
    const onUnload = () => saveNow()
    const onHash = () => setModal(null)
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setModal(null) }
    window.addEventListener('beforeunload', onUnload)
    window.addEventListener('hashchange', onHash)
    document.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('beforeunload', onUnload)
      window.removeEventListener('hashchange', onHash)
      document.removeEventListener('keydown', onKey)
    }
  }, [saveNow])

  const value = useMemo<AppCtx>(() => ({ S, mutate, getS: () => ref.current, reset, toast, openModal, closeModal }), [S, mutate, reset, toast, openModal, closeModal])

  return (
    <AppContext.Provider value={value}>
      {children}
      {modal && <Modal spec={modal} onClose={closeModal} />}
      <Toasts items={toasts} />
    </AppContext.Provider>
  )
}
