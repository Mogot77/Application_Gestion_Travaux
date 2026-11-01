import { useContext } from 'react'
import { AuthContext, type AuthCtx } from '../store/authContext'

export function useAuth(): AuthCtx {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans <AuthProvider>')
  return ctx
}
