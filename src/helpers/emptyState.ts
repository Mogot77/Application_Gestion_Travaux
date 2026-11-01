import type { AppState, Referentiels } from '@/types'

/** Référentiels vides : les vraies valeurs sont dans Firestore (document `ref/main`), éditables depuis l'écran Référentiels. */
export const emptyRef = (): Referentiels => ({
  seuils: { troisDevis: 0, direction: 0, supplementMin: 0 },
  urgences: [], piecesLogement: [], piecesAutres: [], piecesBureau: [], lots: {}, cles: [], fonctions: [], imputations: [],
  circuits: [], motifsRenvoi: [], motifsRejet: [], contextes: [], proprete: [], signalements: {}, natSinistre: [], assureurs: [],
  motifsAcces: [], suitesSupp: [], villes: {}, depts: {},
})

/** État de départ avant l'arrivée des données Firestore (jamais affiché : l'application attend le premier chargement). */
export const emptyState = (): AppState => ({
  v: 1,
  ref: emptyRef(),
  logements: [], ouvriers: [], entreprises: [], demandes: [], rdvs: [], constats: [], consultations: [],
  histoMois: {},
  draft: null,
  profil: 'coord',
  seq: { di: 0, ce: 0, cs: 0, ft: 0, bc: 0 },
})
