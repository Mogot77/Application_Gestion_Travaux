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
