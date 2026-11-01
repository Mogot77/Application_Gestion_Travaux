/* Effets de bord du store : sauvegarde locale, synchronisation Firestore, envoi des photos, cycle de vie de la page. */
import type { AppStore } from '@/store'
import { persistenceEffect } from './persistence'
import { syncEffect } from './sync'
import { photosEffect } from './photos'
import { lifecycleEffect } from './lifecycle'
import { refsMigrationEffect } from './refsMigration'
import type { EffectContext, Listener } from './types'

/** Démarre les effets ; renvoie la fonction qui les arrête. */
export const startEffects = (store: AppStore, listener: Listener): (() => void) => {
  const ctx: EffectContext = { store, listener, cloud: { sync: null } }
  const stops = [persistenceEffect, syncEffect, photosEffect, refsMigrationEffect, lifecycleEffect].map(effect => effect(ctx))
  return () => stops.forEach(stop => stop())
}
