import type { createListenerMiddleware } from '@reduxjs/toolkit'
import type { AppStore } from '@/store'
import type { Sync } from '@/store/queries/appSync'

export type Listener = ReturnType<typeof createListenerMiddleware>

/** Ce que partagent les effets : le store, le middleware d'écoute et la synchronisation Firestore en cours. */
export type EffectContext = { store: AppStore; listener: Listener; cloud: { sync: Sync | null } }

/** Un effet démarre et renvoie sa fonction d'arrêt. */
export type Effect = (ctx: EffectContext) => () => void
