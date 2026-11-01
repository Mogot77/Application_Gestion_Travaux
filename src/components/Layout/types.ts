import type { ReactNode } from 'react'
import type { Role, Section } from '@/helpers/roles'
import type { Theme } from '@/helpers/theme'

export type LayoutProps = { active?: string; children?: ReactNode }

export type NavItem = [Section, string, string]

export type LayoutTheme = Theme

/** Sélecteurs « jouer un rôle » du directeur (test des autres profils). */
export type LayoutPlayModel = {
  role: Role
  options: { value: Role; label: string }[]
  /** Liste des établissements, présente quand le rôle joué en a besoin. */
  etabs?: string[]
  etab: string
  /** Liste des ouvriers, présente quand le rôle joué est ouvrier. */
  ouvriers?: { id: string; nom: string }[]
  ouvrierId: string
}

export type LayoutViewProps = {
  active?: string
  children?: ReactNode
  nav: NavItem[]
  canCreate: boolean
  /** Sélecteurs de rôle (directeur) ; absent sinon. */
  play?: LayoutPlayModel
  /** Libellé du rôle affiché quand l'utilisateur n'est pas directeur. */
  roleLabel?: string
  email?: string
  theme: LayoutTheme
  loggedIn: boolean
  onPlayRole: (role: Role) => void
  onPlayEtab: (etab: string) => void
  onPlayOuvrier: (ouvrierId: string) => void
  onToggleTheme: () => void
  onLogout: () => void
}
