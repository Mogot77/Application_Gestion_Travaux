import type { Role } from '@/helpers/roles'

export type UsersProps = Record<string, never>

export type AppUser = {
  email: string
  role: Role
  /** Établissement de rattachement (rôles travailleur social, chef de service, directeur d'établissement). */
  etab?: string
  addedBy?: string
}
