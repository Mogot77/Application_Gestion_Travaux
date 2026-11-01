import { useContext } from 'react'
import { AppContext, type AppCtx } from '../store/context'

export function useApp(): AppCtx {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp doit être utilisé dans <AppProvider>')
  return ctx
}
