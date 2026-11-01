import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { AppState } from '../types'
import { seed } from '../data/seed'
import { AppContext, type AppCtx, type ModalSpec, type ToastKind } from './context'
import { clearUi, flushUi } from './ui'
import { startSync, type Sync } from '../lib/sync'
import { Modal } from '../components/ui/Modal'
import { Toasts, type ToastItem } from '../components/ui/Toasts'
import { useAuth } from '../hooks/useAuth'
import { ROLES } from '../lib/roles'

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

  const [ready, setReady] = useState(false)
  const [syncFailed, setSyncFailed] = useState(false)
  const sync = useRef<Sync | null>(null)

  const saveNow = useCallback(() => {
    window.clearTimeout(timer.current)
    try { localStorage.setItem(KEY, JSON.stringify(ref.current)) }
    catch { toast('Stockage local plein : supprimez des photos ou réinitialisez la démo', 'err') }
    sync.current?.push(ref.current)
  }, [toast])

  // Données partagées : Firestore est la source de vérité, le localStorage sert de cache et conserve les photos.
  useEffect(() => {
    let errored = false
    const s = startSync({
      local: () => ref.current,
      apply: fn => {
        const next = structuredClone(ref.current)
        fn(next)
        ref.current = next
        setS(next)
        try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* cache local plein : ignoré */ }
      },
      onReady: () => setReady(true),
      onError: () => { if (!errored) { errored = true; setSyncFailed(true); toast("Synchronisation impossible : vos changements ne sont pas enregistrés en ligne", 'err') } },
    })
    sync.current = s
    return () => { s.stop(); sync.current = null }
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
    const onUnload = () => { saveNow(); flushUi() }
    const onVisibility = () => { if (document.visibilityState === 'hidden') onUnload() }
    const onHash = () => setModal(null)
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setModal(null) }
    window.addEventListener('beforeunload', onUnload)
    window.addEventListener('pagehide', onUnload)
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('hashchange', onHash)
    document.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('beforeunload', onUnload)
      window.removeEventListener('pagehide', onUnload)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('hashchange', onHash)
      document.removeEventListener('keydown', onKey)
    }
  }, [saveNow])

  // Le profil n'est plus choisi à la main : il découle du rôle du compte connecté.
  const { user, role, etab, play } = useAuth()
  const email = (user?.email ?? '').toLowerCase()
  const withMe = useCallback((s: AppState): AppState => {
    if (!role) return s
    const info = ROLES[role]
    const ouv = role === 'ouvrier' ? s.ouvriers.find(o => play ? o.id === play.ouvrierId : (o.email ?? '').trim().toLowerCase() === email) : undefined
    const nom = ouv?.nom || user?.displayName || email
    return { ...s, profil: info.profil, moi: { nom, label: `${nom} · ${info.label}`, etab: etab || undefined, fonction: info.label, email, role, portee: info.portee, ouvrierId: ouv?.id } }
  }, [role, etab, email, play, user?.displayName])
  const SM = useMemo(() => withMe(S), [withMe, S])
  const getS = useCallback(() => withMe(ref.current), [withMe])
  const value = useMemo<AppCtx>(() => ({ S: SM, mutate, getS, reset, toast, openModal, closeModal }), [SM, mutate, getS, reset, toast, openModal, closeModal])

  return (
    <AppContext.Provider value={value}>
      {ready ? children : (
        <p className="p-6 text-sm text-[#6b7280]">
          {syncFailed ? "Impossible de joindre la base de données. Vérifiez votre connexion puis rechargez la page." : 'Chargement des données…'}
        </p>
      )}
      {modal && <Modal spec={modal} onClose={closeModal} />}
      <Toasts items={toasts} />
    </AppContext.Provider>
  )
}
