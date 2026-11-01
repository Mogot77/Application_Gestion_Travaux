import type { AppState } from '@/types'
import { ROLES, type Role } from '@/helpers/roles'
import type { Play } from './authContext'

export type MeInput = { role: Role | null; etab: string; email: string; displayName?: string | null; play: Play | null }

/** Le profil n'est plus choisi à la main : il découle du rôle du compte connecté. */
export const withMe = (s: AppState, me: MeInput): AppState => {
  const { role, etab, email, displayName, play } = me
  if (!role) return s
  const info = ROLES[role]
  const ouv = role === 'ouvrier' ? s.ouvriers.find(o => play ? o.id === play.ouvrierId : (o.email ?? '').trim().toLowerCase() === email) : undefined
  const nom = ouv?.nom || displayName || email
  return { ...s, profil: info.profil, moi: { nom, label: `${nom} · ${info.label}`, etab: etab || undefined, fonction: info.label, email, role, portee: info.portee, ouvrierId: ouv?.id } }
}
