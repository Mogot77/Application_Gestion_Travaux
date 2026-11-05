import type { CircuitKey, DemandeStatut, EtatRdv, LigneStatut, Origine, SuiteSupp, UrgenceKey } from './common'

export type Histo = { at: string; t: string }

export type Consommable = { nom: string; qte: number; origine: string; pris: boolean }

export type Ligne = {
  piece: string
  lot: string
  nature: string
  description: string
  photos: string[]
  extra?: Record<string, string>
  imputation: string
  circuit: CircuitKey | ''
  duree: number
  urgence: UrgenceKey | ''
  statut: LigneStatut
  photosApres?: string[]
  supp?: boolean
}

export type SinistreInfo = { nature: string; date: string; fuite: string; tiers: string; constat: string }

export type Demande = {
  id: string
  recueLe: string
  logementId: string
  origine: Origine
  auteur: string
  fonction: string
  tel: string
  urgence: UrgenceKey
  dateSouhaitee: string
  /** Logement Solibail : créneaux de RDV prévalidés avec le locataire (AAAA-MM-JJTHH:MM). */
  rdvLocataire?: string[]
  acces: string
  numCles: string
  lieuCles: string
  facturation: string
  sinistre: string
  sinistreInfo: SinistreInfo | null
  observations: string
  message: string
  consommables: Consommable[]
  historique: Histo[]
  statut: DemandeStatut
  ft: string
  constatId?: string
  lignes: Ligne[]
  motifRenvoi?: string
  msgRenvoi?: string
  motifRejet?: string
  consultationId?: string
  dateIntervention?: string
  parentId?: string
  /** E-mail du compte ayant créé la demande. */
  auteurEmail?: string
}

export type DraftLigne = {
  piece: string
  lot: string
  nature: string
  description: string
  photos: string[]
  extra: Record<string, string>
}

export type DraftDemande = {
  auteur: string
  /** Compte ayant ouvert le brouillon (un brouillon d'un autre compte est écarté). */
  auteurEmail?: string
  fonction: string
  tel: string
  logementId: string
  urgence: UrgenceKey | ''
  dateSouhaitee: string
  /** Créneaux prévalidés avec le locataire (logement Solibail) ; absent des anciens brouillons. */
  rdvLocataire?: string[]
  acces: string
  numCles: string
  lieuCles: string
  facturation: string
  sinistre: string
  sinistreInfo: SinistreInfo
  observations: string
  lignes: DraftLigne[]
  canal: string
  constatId: string
  savedAt: string
}

export type SuppWork = {
  photo: string
  piece: string
  lot: string
  nature: string
  description: string
  duree: number
  suite: SuiteSupp
}

export type SuppRapport = SuppWork & { suiteLabel: string }

export type Work = {
  lignes: Record<number, LigneStatut>
  motifs: Record<number, string>
  apres: Record<number, string[]>
  conso: { nom: string; qte: number }[]
  supps: SuppWork[]
  obs: string
  signature: string
  signataire: string
  corr: { min: number; motif: string } | null
}

export type Rapport = {
  /** Temps passé : décompte du chronomètre de la mission (reprises comprises) à la fin de mission. */
  tempsMin: number
  /** Ouvriers présents sur la mission (responsable en premier). */
  equipe?: string[]
  /** Nombre de déplacements effectués. */
  deplacements?: number
  /** Contrôles de fin de mission cochés (voir `CHECKS_FIN`). */
  checks?: string[]
  /** Photos de l'état initial et du résultat, intégrées au rapport. */
  photosAvant?: string[]
  photosApres?: string[]
  lignes: LigneStatut[]
  motifs: string[]
  conso: { nom: string; qte: number }[]
  supps: SuppRapport[]
  obs: string
  signature: string
  signataire: string
  corr: { min: number; motif: string } | null
}

export type Rdv = {
  id: string
  /** Responsable de la mission. */
  ouvrierId: string
  /** Ouvriers en renfort sur la même mission (même créneau). */
  renfortIds?: string[]
  date: string
  debut: string
  duree: number
  label: string
  etat: EtatRdv
  demandeId?: string
  debutReel?: string
  finReel?: string
  motifImp?: string
  photoImp?: string
  /** Photos de l'état initial (début de mission) et de ce qui a été fait (fin de mission). */
  photosAvant?: string[]
  photosApres?: string[]
  /** Chronomètre caché : secondes déjà cumulées (missions reprises) et instant (ms) du dernier démarrage ; absent hors mission en cours. */
  chronoCumulSec?: number
  chronoDepuis?: number
  rapport?: Rapport
  work?: Work
}
