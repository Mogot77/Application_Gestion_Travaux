import { createContext } from 'react'
import type { AuthUser } from '../lib/firebase'

export interface AuthCtx {
  /** `undefined` tant que l'état de connexion n'est pas connu, `null` si déconnecté. */
  user: AuthUser | null | undefined
  error: string
  login: () => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthCtx | null>(null)
