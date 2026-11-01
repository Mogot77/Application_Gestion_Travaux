import type { CircuitKey, SuiteSupp, UrgenceKey } from './common'

export type Seuils = { troisDevis: number; direction: number; supplementMin: number }

export type UrgenceRef = { k: UrgenceKey; l: string; d: string }

export type CircuitRef = { k: CircuitKey; l: string; d: string }

export type SuiteSuppRef = { k: SuiteSupp; l: string; d: string }

export type Referentiels = {
  seuils: Seuils
  urgences: UrgenceRef[]
  piecesLogement: string[]
  piecesAutres: string[]
  piecesBureau: string[]
  lots: Record<string, string[]>
  cles: string[]
  fonctions: string[]
  imputations: string[]
  circuits: CircuitRef[]
  motifsRenvoi: string[]
  motifsRejet: string[]
  contextes: string[]
  proprete: string[]
  signalements: Record<string, string[]>
  natSinistre: string[]
  assureurs: string[]
  motifsAcces: string[]
  suitesSupp: SuiteSuppRef[]
  /** Coordonnées (latitude, longitude) du centre des villes, en repli quand un logement n'est pas géolocalisé. */
  villes: Record<string, [number, number]>
  /** Code département -> libellé du dossier de classement. */
  depts: Record<string, string>
  /** Migration ponctuelle des villes/départements du code vers Firestore (voir store/listeners/refsMigration.ts). */
  refsMigrated?: boolean
}
