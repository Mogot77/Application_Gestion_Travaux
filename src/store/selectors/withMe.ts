import type { AppState } from '@/types'
import { ROLES, type Role } from '@/helpers/roles'
import type { Play } from '@/store/providers/authContext'

export type MeInput = { role: Role | null; etab: string; email: string; displayName?: string | null; play: Play | null }

let last: { s: AppState; me: MeInput; out: AppState } | null = null

const sameMe = (a: MeInput, b: MeInput) =>
  a.role === b.role && a.etab === b.etab && a.email === b.email && a.displayName === b.displayName && a.play === b.play

/** Le profil n'est plus choisi à la main : il découle du rôle du compte connecté.
 *  Le résultat est mémorisé : tous les composants reçoivent le même objet tant que l'état et le compte ne changent pas,
 *  ce qui évite de recalculer et de casser les comparaisons de références. */
export const withMe = (s: AppState, me: MeInput): AppState => {
  if (last && last.s === s && sameMe(last.me, me)) return last.out
  const out = computeMe(s, me)
  last = { s, me, out }
  return out
}

const computeMe = (s: AppState, me: MeInput): AppState => {
  const { role, etab, email, displayName, play } = me
  if (!role) return s
  const info = ROLES[role]
  const ouv = role === 'ouvrier' ? s.ouvriers.find(o => play ? o.id === play.ouvrierId : (o.email ?? '').trim().toLowerCase() === email) : undefined
  const nom = ouv?.nom || displayName || email
  return { ...s, profil: info.profil, moi: { nom, label: `${nom} · ${info.label}`, etab: etab || undefined, fonction: info.label, email, role, portee: info.portee, ouvrierId: ouv?.id } }
}
