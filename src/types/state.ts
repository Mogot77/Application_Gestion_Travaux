import type { ProfilKey } from './common'
import type { Consultation } from './consultations'
import type { Constat, Logement } from './housing'
import type { Entreprise, Ouvrier } from './people'
import type { Referentiels } from './references'
import type { Demande, DraftDemande, Rdv } from './requests'

/** Données partagées entre tous les utilisateurs : stockées dans Firestore. */
export type SharedState = {
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
  seq: { di: number; ce: number; cs: number; ft: number; bc: number }
}

/** État propre à ce navigateur : jamais envoyé à Firestore. */
export type LocalState = {
  /** Brouillon de demande en cours de saisie. */
  draft: DraftDemande | null
  /** Profil déduit du rôle du compte connecté (renseigné par `withMe`). */
  profil: ProfilKey
  /** Compte connecté (renseigné par `withMe`, non persisté). */
  moi?: Moi
}

export type AppState = SharedState & LocalState

export type ProfilInfo = { nom: string; label: string; etab?: string; fonction: string }

/** Utilisateur connecté (non persisté) : identité, rôle et rattachement. */
export type Moi = ProfilInfo & { email: string; role: string; portee: 'toutes' | 'etab' | 'siennes'; ouvrierId?: string }
