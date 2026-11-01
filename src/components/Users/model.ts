import type { Role } from '@/helpers/roles'
import type { AppUser, UserRow } from './types'

export const isEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)

/** Lignes du tableau. L'administrateur d'origine apparaît toujours, même sans document. */
export const buildUserRows = (users: AppUser[], bootstrapAdmin: string, me: string): UserRow[] => {
  const all: AppUser[] = users.some(u => u.email === bootstrapAdmin) ? users : [{ email: bootstrapAdmin, role: 'directeur' as Role }, ...users]
  return all.map(u => ({ ...u, fixed: u.email === bootstrapAdmin, self: u.email === me }))
}
