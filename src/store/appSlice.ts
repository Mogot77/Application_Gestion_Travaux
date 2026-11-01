import { createSlice, type PayloadAction, type ThunkAction, type UnknownAction } from '@reduxjs/toolkit'
import type { AppState } from '@/types'
import { seed } from '@/data/seed'
import { KEY } from './persistence'
import { clearUi } from '@/helpers/uiState'

/** Modification de l'état : écrite en mutant directement (Immer produit la nouvelle version). */
export type Recipe = (s: AppState) => void

/** Données partagées du métier (demandes, logements, ouvriers...). Firestore est la source de vérité. */
const appSlice = createSlice({
  name: 'app',
  initialState: (): AppState => seed(),
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

/** Remet les données de démonstration. */
export const resetDemo = (): ThunkAction<void, unknown, unknown, UnknownAction> => dispatch => {
  try { localStorage.removeItem(KEY) } catch { /* ignoré */ }
  clearUi()
  dispatch(replaced(seed()))
}
