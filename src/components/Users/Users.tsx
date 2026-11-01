import { useEffect, useState, type FormEvent } from 'react'
import { useApp } from '@/hooks/useApp'
import { useAuth } from '@/hooks/useAuth'
import Layout from '@/components/Layout'
import { BOOTSTRAP_ADMIN, normEmail } from '@/store/queries/users'
import { ROLES, type Role } from '@/helpers/roles'
import { uniqueEtabs } from '@/helpers/domain'
import { removeUser, saveUser, watchUsers } from './helpers'
import { buildUserRows, isEmail } from './model'
import UsersView from './UsersView'
import type { AppUser, UsersForm, UsersStatus } from './types'

/** Gestion de la liste blanche des comptes Google autorisés (réservée aux administrateurs). */
const Users = () => {
  const { S, toast } = useApp()
  const etabs = uniqueEtabs(S)
  const { user, isAdmin } = useAuth()
  const me = normEmail(user?.email ?? '')
  const [users, setUsers] = useState<AppUser[] | null>(null)
  const [form, setForm] = useState<UsersForm>({ email: '', role: 'travailleur_social', etab: '' })
  const [busy, setBusy] = useState(false)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    if (!isAdmin) return
    return watchUsers(setUsers, () => setLoadError(true))
  }, [isAdmin])

  const run = async (fn: () => Promise<void>, ok: string) => {
    setBusy(true)
    try { await fn(); toast(ok, 'ok') } catch { toast("Action refusée ou impossible (droits ou réseau)", 'err') }
    setBusy(false)
  }

  const onAdd = (e?: FormEvent) => {
    e?.preventDefault()
    const { role, etab } = form
    const mail = normEmail(form.email)
    if (!isEmail(mail)) { toast('Adresse e-mail invalide', 'err'); return }
    if (ROLES[role].needsEtab && !etab) { toast('Choisissez un établissement pour ce rôle', 'err'); return }
    void run(async () => { await saveUser(mail, role, me, ROLES[role].needsEtab ? etab : ''); setForm(f => ({ ...f, email: '' })) }, 'Utilisateur ajouté')
  }

  const onChangeRole = (email: string, r: Role) => {
    const u = users?.find(x => x.email === email)
    void run(() => saveUser(email, r, me, ROLES[r].needsEtab ? u?.etab ?? '' : ''), 'Rôle modifié')
  }
  const onChangeEtab = (email: string, etab: string) => {
    const u = users?.find(x => x.email === email)
    if (u) void run(() => saveUser(email, u.role, me, etab), 'Établissement modifié')
  }
  const onRemove = (email: string) => {
    if (confirm(`Retirer l'accès à ${email} ?`)) void run(() => removeUser(email), 'Accès retiré')
  }

  const status: UsersStatus = !isAdmin ? 'forbidden' : loadError ? 'error' : users === null ? 'loading' : 'ready'

  return (
    <Layout active="utilisateurs">
      <UsersView
        status={status}
        rows={users ? buildUserRows(users, BOOTSTRAP_ADMIN, me) : []}
        etabs={etabs}
        form={form}
        busy={busy}
        onFormChange={patch => setForm(f => ({ ...f, ...patch }))}
        onAdd={onAdd}
        onChangeRole={onChangeRole}
        onChangeEtab={onChangeEtab}
        onRemove={onRemove}
      />
    </Layout>
  )
}

export default Users
