import type { Histo } from './requests'

export type FactureStatut = 'brouillon' | 'emise' | 'payee' | 'annulee'

/** Ligne de facture : montants unitaires hors taxe, taux de TVA en pourcentage. */
export type FactureLigne = { libelle: string; qte: number; unite: string; puHT: number; tva: number }

/** Coordonnées figées sur la facture (émetteur ou destinataire). */
export type Partie = { nom: string; adresse: string; cp: string; ville: string; email: string; tel: string }

/** Informations légales de l'émetteur. */
export type Emetteur = Partie & { siret: string; tvaIntra: string; iban: string }

export type Facture = {
  id: string
  demandeId: string
  statut: FactureStatut
  /** Date d'émission. */
  date: string
  /** Date limite de paiement. */
  echeance: string
  /** Date ou période de la prestation. */
  prestation: string
  emetteur: Emetteur
  destinataire: Partie
  objet: string
  lignes: FactureLigne[]
  /** Mention libre (conditions, modalités de paiement...). */
  notes: string
  historique: Histo[]
  payeeLe?: string
}
