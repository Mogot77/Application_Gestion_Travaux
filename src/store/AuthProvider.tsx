import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { signInWithGoogle, signOutUser, watchAuth, type AuthUser } from '../lib/firebase'
import { AuthContext, type AuthCtx } from './authContext'

const message = (e: unknown): string => {
  const code = (e as { code?: string })?.code
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return ''
  if (code === 'auth/popup-blocked') return 'La fenêtre de connexion a été bloquée par le navigateur.'
  if (code === 'auth/unauthorized-domain') return "Ce domaine n'est pas autorisé dans Firebase Authentication."
  if (code === 'auth/operation-not-allowed') return "La connexion Google n'est pas activée dans Firebase Authentication."
  if (code === 'auth/network-request-failed') return 'Connexion réseau indisponible.'
  return 'Connexion impossible. Réessayez.'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined)
  const [error, setError] = useState('')

  useEffect(() => watchAuth(setUser), [])

  const login = useCallback(async () => {
    setError('')
    try { await signInWithGoogle() } catch (e) { setError(message(e)) }
  }, [])

  const logout = useCallback(async () => {
    try { await signOutUser() } catch (e) { setError(message(e)) }
  }, [])

  const value = useMemo<AuthCtx>(() => ({ user, error, login, logout }), [user, error, login, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
