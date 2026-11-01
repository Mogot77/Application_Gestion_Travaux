import type { AppState } from '@/types'
import { uniqueEtabs } from '@/helpers/domain'
import { ROLES, ROLE_LIST, canSee, type Role } from '@/helpers/roles'
import { NAV } from './constants'
import type { LayoutPlayModel, NavItem } from './types'

/** Onglets de navigation visibles pour un rôle. */
export const navFor = (role: Role | null): NavItem[] => NAV.filter(([k]) => canSee(role, k))

/** Modèle des sélecteurs « jouer un rôle » du directeur (`play` = rôle joué, null = compte réel). */
export const buildPlayModel = (S: AppState, play: { role: Role; etab: string; ouvrierId: string } | null): LayoutPlayModel => ({
  role: play?.role ?? 'directeur',
  options: ROLE_LIST.map(r => ({ value: r, label: r === 'directeur' ? 'Directeur (mon compte)' : 'Test : ' + ROLES[r].label })),
  etabs: play && ROLES[play.role].needsEtab ? uniqueEtabs(S) : undefined,
  etab: play?.etab ?? '',
  ouvriers: play?.role === 'ouvrier' ? S.ouvriers.map(o => ({ id: o.id, nom: o.nom })) : undefined,
  ouvrierId: play?.ouvrierId ?? '',
})
