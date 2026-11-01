import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit'
import { setAutoFreeze } from 'immer'
import { rootReducer, mutated, remoteApplied } from '@/store/reducers'
import { loadState } from '@/store/queries/localCache'

// L'ancien état n'était jamais gelé : on garde ce comportement (certains écrans trient/modifient des copies de l'état).
setAutoFreeze(false)

export type { RootState } from '@/store/reducers'

/** Un store par session connectée : l'état de départ est le cache local, Firestore le met ensuite à jour. */
export const createAppStore = () => {
  const listener = createListenerMiddleware()
  const store = configureStore({
    reducer: rootReducer,
    preloadedState: { app: loadState() },
    middleware: getDefault => getDefault({
      // Les actions `mutated` / `remoteApplied` portent une fonction ; l'état métier est trop gros pour être vérifié à chaque action.
      immutableCheck: false,
      serializableCheck: { ignoredActions: [mutated.type, remoteApplied.type], ignoredActionPaths: ['payload.fn'], ignoredPaths: ['app'] },
    }).prepend(listener.middleware),
  })
  return { store, listener }
}

export type AppStore = ReturnType<typeof createAppStore>['store']
export type AppDispatch = AppStore['dispatch']
