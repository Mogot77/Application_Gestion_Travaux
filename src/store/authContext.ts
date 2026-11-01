import { createContext } from 'react'
import type { AuthUser } from '../lib/firebase'
import type { Role } from '../lib/users'

export interface AuthCtx {
  /** `undefined` tant que l'état de connexion n'est pas connu, `null` si déconnecté. */
  user: AuthUser | null | undefined
  /** Autorisation dans la liste blanche : `loading` en cours, `denied` compte non autorisé, `error` lecture impossible. */
  access: 'loading' | 'ok' | 'denied' | 'error'
  role: Role | null
  isAdmin: boolean
  error: string
  login: () => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthCtx | null>(null)
