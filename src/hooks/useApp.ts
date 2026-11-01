import { useCallback, useMemo } from 'react'
import { useAppDispatch, useAppSelector, useAppStore } from '@/hooks/useAppStore'
import { mutated } from '@/store/reducers'
import { resetLocal, toast as toastAction } from '@/store/thunks'
import { selectApp, withMe } from '@/store/selectors'
import { closeModal, openModal } from '@/store/local/modal'
import type { AppCtx } from '@/store/types'
import { useAuth } from './useAuth'

/** Façade des écrans sur le store Redux : état (avec le profil du compte connecté) et actions. */
export const useApp = (): AppCtx => {
  const dispatch = useAppDispatch()
  const store = useAppStore()
  const app = useAppSelector(selectApp)
  const { user, role, etab, play } = useAuth()
  const email = (user?.email ?? '').toLowerCase()
  const displayName = user?.displayName

  const me = useMemo(() => ({ role, etab, email, displayName, play }), [role, etab, email, displayName, play])
  const S = useMemo(() => withMe(app, me), [app, me])
  const getS = useCallback(() => withMe(store.getState().app, me), [store, me])
  const mutate = useCallback<AppCtx['mutate']>((fn, opts) => { dispatch(mutated({ fn, now: opts?.now })) }, [dispatch])
  const reset = useCallback(() => { dispatch(resetLocal()) }, [dispatch])
  const toast = useCallback<AppCtx['toast']>((msg, kind) => { dispatch(toastAction(msg, kind)) }, [dispatch])

  return useMemo(() => ({ S, mutate, getS, reset, toast, openModal, closeModal }), [S, mutate, getS, reset, toast])
}
