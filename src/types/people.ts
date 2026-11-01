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
