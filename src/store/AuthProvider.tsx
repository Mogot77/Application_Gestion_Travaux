import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { signInWithGoogle, signOutUser, watchAuth, type AuthUser } from '../lib/firebase'
import { fetchAccess, type Role } from '../lib/users'
import { AuthContext, type AuthCtx, type Play } from './authContext'

const message = (e: unknown): string => {
  const code = (e as { code?: string })?.code
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return ''
  if (code === 'auth/popup-blocked') return 'La fenêtre de connexion a été bloquée par le navigateur.'
  if (code === 'auth/unauthorized-domain') return "Ce domaine n'est pas autorisé dans Firebase Authentication."
  if (code === 'auth/operation-not-allowed') return "La connexion Google n'est pas activée dans Firebase Authentication."
  if (code === 'auth/network-request-failed') return 'Connexion réseau indisponible.'
  return 'Connexion impossible. Réessayez.'
}

interface Access { uid: string; state: AuthCtx['access']; role: Role | null; etab: string }

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined)
  const [acc, setAcc] = useState<Access | null>(null)
  const [error, setError] = useState('')
  const [play, setPlay] = useState<Play | null>(null)

  useEffect(() => watchAuth(setUser), [])

  // Vérifie la liste blanche à chaque changement de compte.
  useEffect(() => {
    if (!user) return
    let cancelled = false
    const set = (state: Access['state'], role: Role | null, etab = '') => { if (!cancelled) setAcc({ uid: user.uid, state, role, etab }) }
    if (!user.email || !user.emailVerified) { set('denied', null); return }
    fetchAccess(user.email).then(r => set(r ? 'ok' : 'denied', r?.role ?? null, r?.etab), () => set('error', null))
    return () => { cancelled = true }
  }, [user])

  const login = useCallback(async () => {
    setError('')
    try { await signInWithGoogle() } catch (e) { setError(message(e)) }
  }, [])

  const logout = useCallback(async () => {
    try { await signOutUser() } catch (e) { setError(message(e)) }
  }, [])

  const value = useMemo<AuthCtx>(() => {
    const cur = user && acc && acc.uid === user.uid ? acc : null
    return {
      user,
      access: cur ? cur.state : 'loading',
      role: cur?.role === 'directeur' && play ? play.role : cur?.role ?? null,
      realRole: cur?.role ?? null,
      play: cur?.role === 'directeur' ? play : null,
      setPlay,
      isAdmin: cur?.role === 'directeur',
      etab: cur?.role === 'directeur' && play ? play.etab : cur?.etab ?? '',
      error, login, logout,
    }
  }, [user, acc, error, play, login, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
