/* Rôles des utilisateurs et droits associés (logique pure). */
import type { ProfilKey } from '../types'

export type Role = 'directeur' | 'coordinateur' | 'ouvrier' | 'travailleur_social' | 'chef_service' | 'directeur_etab'

/** Sections de l'application, utilisées pour le menu et la protection des routes. */
export type Section =
  | 'demandes' | 'planning' | 'ouvriers' | 'entreprises' | 'logements' | 'carte'
  | 'constats' | 'facturation' | 'tableau' | 'classement' | 'referentiels' | 'utilisateurs'

/** Portée des demandes visibles : toutes, celles de l'établissement, ou celles que l'on a créées. */
export type Portee = 'toutes' | 'etab' | 'siennes'

export type RoleInfo = {
  label: string
  description: string
  /** Profil historique utilisé par les écrans (droits d'édition, filtres par établissement). */
  profil: ProfilKey
  sections: Section[]
  portee: Portee
  /** Peut créer une demande. */
  creerDemande: boolean
  /** Rattaché à un établissement (à renseigner dans la gestion des utilisateurs). */
  needsEtab: boolean
}

export const ROLES: Record<Role, RoleInfo> = {
  directeur: {
    label: 'Directeur',
    description: 'Voit et gère tout, administre les utilisateurs.',
    profil: 'dir', portee: 'toutes', creerDemande: true, needsEtab: false,
    sections: ['demandes', 'planning', 'ouvriers', 'entreprises', 'logements', 'carte', 'constats', 'facturation', 'tableau', 'classement', 'referentiels', 'utilisateurs'],
  },
  coordinateur: {
    label: 'Coordinateur du service technique',
    description: 'Voit les demandes entrantes et répartit les missions entre les ouvriers.',
    profil: 'coord', portee: 'toutes', creerDemande: true, needsEtab: false,
    sections: ['demandes', 'planning', 'ouvriers', 'logements', 'carte', 'constats', 'facturation', 'classement'],
  },
  ouvrier: {
    label: 'Ouvrier',
    description: 'Voit uniquement son propre planning.',
    profil: 'coord', portee: 'siennes', creerDemande: false, needsEtab: false,
    sections: ['planning'],
  },
  travailleur_social: {
    label: 'Travailleur social',
    description: 'Fait des demandes et suit celles qu’il a créées.',
    profil: 'etab', portee: 'siennes', creerDemande: true, needsEtab: true,
    sections: ['demandes'],
  },
  chef_service: {
    label: 'Chef de service',
    description: 'Fait des demandes et suit celles qu’il a créées.',
    profil: 'etab', portee: 'siennes', creerDemande: true, needsEtab: true,
    sections: ['demandes'],
  },
  directeur_etab: {
    label: 'Directeur d’établissement',
    description: 'Fait des demandes et voit l’état de toutes les demandes de son établissement.',
    profil: 'etab', portee: 'etab', creerDemande: true, needsEtab: true,
    sections: ['demandes'],
  },
}

export const ROLE_LIST = Object.keys(ROLES) as Role[]

/** Convertit une valeur stockée (y compris les anciens rôles `admin` / `user`) en rôle courant. */
export function normRole(v: unknown): Role {
  if (v === 'admin') return 'directeur'
  if (typeof v === 'string' && v in ROLES) return v as Role
  return 'coordinateur' // ancien rôle « user » : accès opérationnel sans administration
}

export const canSee = (role: Role | null, s: Section) => !!role && ROLES[role].sections.includes(s)

/** Section correspondant à un chemin de route (null = route libre). */
export function sectionOf(path: string): Section | null {
  const seg = path.split('/')[1] ?? ''
  const map: Record<string, Section> = {
    demandes: 'demandes', demande: 'demandes', planning: 'planning', tournees: 'planning', fiche: 'planning',
    ouvriers: 'ouvriers', entreprises: 'entreprises', consultation: 'entreprises', devis: 'entreprises', portail: 'entreprises',
    logements: 'logements', logement: 'logements', carte: 'carte', constats: 'constats', constat: 'constats', facturation: 'facturation', facture: 'facturation',
    tableau: 'tableau', classement: 'classement', referentiels: 'referentiels', utilisateurs: 'utilisateurs',
  }
  return map[seg] ?? null
}
