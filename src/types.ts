/* Modèle de données de l'application (format identique à celui stocké dans localStorage) */

export type ProfilKey = 'etab' | 'coord' | 'dir'
export type UrgenceKey = 'urgent' | 'h48' | 'prog'
export type CircuitKey = 'ST' | 'bailleur' | 'prestataire' | 'sinistre'
export type Origine = 'etab' | 'mail' | 'tel' | 'occupant' | 'supp'
export type LigneStatut = '' | 'planifiee' | 'realisee' | 'partielle' | 'non_realisee'
export type EtatRdv = 'planned' | 'running' | 'done' | 'imp'
export type SuiteSupp = 'realise' | 'programmer' | 'validation'

export type DemandeStatut =
  | 'brouillon' | 'a_qualifier' | 'a_valider_occupant' | 'en_qualification' | 'a_completer'
  | 'a_reactualiser' | 'a_planifier' | 'planifiee' | 'en_cours' | 'acces_impossible'
  | 'realisee' | 'cloturee' | 'rejetee' | 'bailleur' | 'consultation' | 'prestataire'
  | 'sinistre' | 'annulee'

export type Option = { v: string | number; l: string }

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

export type Logement = {
  id: string
  typo: string
  surface: number
  adresse: string
  bat: string
  etage: string
  apt: string
  cp: string
  ville: string
  etab: string
  section: string
  cgl: string
  dispositif: string
  menage: string
  secteur: string
  cles: string
  acces: string
  dept: string
  bailleur: string
  crypto: string
  actif: boolean
  lat?: number
  lng?: number
}

export type Ouvrier = {
  id: string
  nom: string
  metier: string
  color: string
  actif?: boolean
  tel?: string
  email?: string
}

export type DocsEntreprise = { kbis: string; urssaf: string; rc: string; decennale: string }

export type Entreprise = {
  id: string
  nom: string
  ville: string
  activite: string
  lots: string[]
  secteur: string
  chantiers: number
  note: number
  accordCadre?: boolean
  docs: DocsEntreprise
}

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
  tempsMin: number
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
  ouvrierId: string
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
  rapport?: Rapport
  work?: Work
}

export type Constat = {
  id: string
  date: string
  logementId: string
  auteur: string
  fonction: string
  contexte: string
  proprete: number
  bati: string
  signalements: string[]
  photos: string[]
  commentaire: string
  suite: string
  demandeId?: string
}

export type ReponseDevis = {
  statut: 'attente' | 'recu' | 'decline'
  date?: string
  motif?: string
  montantHT?: number
  tva?: number
  delai?: number
  duree?: number
  validite?: number
  postes?: number[]
  pdf?: string
  visite?: string
  slot?: string
  qualite?: number | null
}

export type DecisionDevis = {
  entrepriseId: string
  motif: string
  imputation: string
  statut: 'brouillon' | 'a_valider' | 'validee'
  bc?: string
  at?: string
}

export type Question = { q: string; a: string; at: string }

export type Consultation = {
  id: string
  demandeId: string
  statut: 'brouillon' | 'envoyee' | 'commande'
  mode: 'accord' | 'devis' | 'unique'
  lignes: number[]
  descriptif: string
  entreprises: string[]
  dateLimite: string
  heureLimite: string
  visite: boolean
  creneaux: string[]
  delai: string
  criteres: { prix: number; delai: number; qualite: number }
  estimation: string
  message: string
  motifUnique: string
  reponses: Record<string, ReponseDevis>
  questions: Question[]
  historique: Histo[]
  decision: DecisionDevis | null
  envoyeeLe?: string
}

export type AppState = {
  v: 1
  ref: Referentiels
  logements: Logement[]
  ouvriers: Ouvrier[]
  entreprises: Entreprise[]
  demandes: Demande[]
  rdvs: Rdv[]
  constats: Constat[]
  consultations: Consultation[]
  histoMois: Record<string, number>
  draft: DraftDemande | null
  profil: ProfilKey
  moi?: Moi
  seq: { di: number; ce: number; cs: number; ft: number; bc: number }
}

export type ProfilInfo = { nom: string; label: string; etab?: string; fonction: string }

/** Utilisateur connecté (non persisté) : identité, rôle et rattachement. */
export type Moi = ProfilInfo & { email: string; role: string; portee: 'toutes' | 'etab' | 'siennes'; ouvrierId?: string }

export type Tone = 'u' | 'h48' | 'pg' | 'rx' | 'ok' | 'gr' | 'tl' | 'ko' | 'bad' | 'wa' | 'mid' | 'bl'
