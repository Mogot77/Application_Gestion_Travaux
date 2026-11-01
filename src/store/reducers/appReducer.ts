import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { AppState } from '@/types'
import { emptyState } from '@/helpers/emptyState'

/** Modification de l'état : écrite en mutant directement (Immer produit la nouvelle version). */
export type Recipe = (s: AppState) => void

/** Données partagées du métier (demandes, logements, ouvriers, référentiels...). Firestore est la source de vérité. */
const appSlice = createSlice({
  name: 'app',
  initialState: (): AppState => emptyState(),
  reducers: {
    /** Modification locale : sera sauvegardée (cache + Firestore). `now` = immédiatement, sinon avec un léger délai. */
    mutated: (state, a: PayloadAction<{ fn: Recipe; now?: boolean }>) => { a.payload.fn(state as AppState) },
    /** Modification reçue de Firestore : mise à jour du cache seulement, rien à renvoyer en ligne. */
    remoteApplied: (state, a: PayloadAction<{ fn: Recipe }>) => { a.payload.fn(state as AppState) },
    replaced: (_state, a: PayloadAction<AppState>) => a.payload,
  },
})

export const { mutated, remoteApplied, replaced } = appSlice.actions
export default appSlice.reducer
