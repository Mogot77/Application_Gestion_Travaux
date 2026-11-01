import { createContext } from 'react'
import type { AuthUser } from '../lib/firebase'
import type { Role } from '../lib/users'

/** Rôle « joué » par un directeur pour voir l'application comme un autre profil. */
export interface Play { role: Role; etab: string; ouvrierId: string }

export interface AuthCtx {
  /** `undefined` tant que l'état de connexion n'est pas connu, `null` si déconnecté. */
  user: AuthUser | null | undefined
  /** Autorisation dans la liste blanche : `loading` en cours, `denied` compte non autorisé, `error` lecture impossible. */
  access: 'loading' | 'ok' | 'denied' | 'error'
  role: Role | null
  isAdmin: boolean
  /** Rôle réel du compte (le rôle effectif `role` peut différer si un directeur en joue un autre). */
  realRole: Role | null
  play: Play | null
  setPlay: (p: Play | null) => void
  /** Établissement de rattachement du compte (rôles d'établissement). */
  etab: string
  error: string
  login: () => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthCtx | null>(null)
