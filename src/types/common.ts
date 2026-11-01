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

export type Tone = 'u' | 'h48' | 'pg' | 'rx' | 'ok' | 'gr' | 'tl' | 'ko' | 'bad' | 'wa' | 'mid' | 'bl'
