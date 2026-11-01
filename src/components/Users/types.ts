import type { Role } from '@/helpers/roles'

export type UsersProps = Record<string, never>

export type AppUser = {
  email: string
  role: Role
  /** Établissement de rattachement (rôles travailleur social, chef de service, directeur d'établissement). */
  etab?: string
  addedBy?: string
}

/** Ligne du tableau : compte + indicateurs d'affichage. */
export type UserRow = AppUser & {
  /** Administrateur d'origine : rôle figé, non retirable. */
  fixed: boolean
  /** Compte de l'utilisateur connecté : rôle non modifiable, non retirable. */
  self: boolean
}

export type UsersStatus = 'forbidden' | 'error' | 'loading' | 'ready'

export type UsersForm = { email: string; role: Role; etab: string }

export type UsersViewProps = {
  status: UsersStatus
  rows: UserRow[]
  etabs: string[]
  form: UsersForm
  busy: boolean
  onFormChange: (patch: Partial<UsersForm>) => void
  onAdd: () => void
  onChangeRole: (email: string, role: Role) => void
  onChangeEtab: (email: string, etab: string) => void
  onRemove: (email: string) => void
}
