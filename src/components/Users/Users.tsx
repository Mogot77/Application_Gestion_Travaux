import { useEffect, useState, type FormEvent } from 'react'
import { useApp } from '@/hooks/useApp'
import { useAuth } from '@/hooks/useAuth'
import Layout from '@/components/Layout'
import Button from '@/components/ui/Button'
import Field from '@/components/ui/Field'
import { BOOTSTRAP_ADMIN, normEmail } from '@/helpers/users'
import { ROLES, ROLE_LIST, type Role } from '@/helpers/roles'
import { uniqueEtabs } from '@/helpers/domain'
import { isEmail, removeUser, saveUser, watchUsers } from './helpers'
import type { AppUser } from './types'

/** Gestion de la liste blanche des comptes Google autorisés (réservée aux administrateurs). */
const Users = () => {
  const { S, toast } = useApp()
  const etabs = uniqueEtabs(S)
  const { user, isAdmin } = useAuth()
  const me = normEmail(user?.email ?? '')
  const [users, setUsers] = useState<AppUser[] | null>(null)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role>('travailleur_social')
  const [etab, setEtab] = useState('')
  const [busy, setBusy] = useState(false)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    if (!isAdmin) return
    return watchUsers(setUsers, () => setLoadError(true))
  }, [isAdmin])

  if (!isAdmin) {
    return <Layout active="utilisateurs"><p className="card p-6 text-sm">Cette page est réservée aux administrateurs.</p></Layout>
  }

  const run = async (fn: () => Promise<void>, ok: string) => {
    setBusy(true)
    try { await fn(); toast(ok, 'ok') } catch { toast("Action refusée ou impossible (droits ou réseau)", 'err') }
    setBusy(false)
  }

  const onAdd = (e: FormEvent) => {
    e.preventDefault()
    const mail = normEmail(email)
    if (!isEmail(mail)) { toast('Adresse e-mail invalide', 'err'); return }
    if (ROLES[role].needsEtab && !etab) { toast('Choisissez un établissement pour ce rôle', 'err'); return }
    void run(async () => { await saveUser(mail, role, me, ROLES[role].needsEtab ? etab : ''); setEmail('') }, 'Utilisateur ajouté')
  }

  // L'administrateur d'origine apparaît toujours, même sans document.
  const rows: AppUser[] = users ? (users.some(u => u.email === BOOTSTRAP_ADMIN) ? users : [{ email: BOOTSTRAP_ADMIN, role: 'directeur' as Role }, ...users]) : []

  return (
    <Layout active="utilisateurs">
      <h1 className="mb-4 text-xl font-bold">Utilisateurs</h1>
      <form className="card mb-4 flex flex-wrap items-end gap-3 p-4" onSubmit={onAdd}>
        <Field label="Compte Google (e-mail)" htmlFor="ue" className="min-w-[240px] flex-1">
          <input className="in" id="ue" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="prenom.nom@gmail.com" required />
        </Field>
        <Field label="Rôle" htmlFor="ur">
          <select className="in" id="ur" value={role} onChange={e => setRole(e.target.value as Role)}>
            {ROLE_LIST.map(r => <option key={r} value={r}>{ROLES[r].label}</option>)}
          </select>
        </Field>
        {ROLES[role].needsEtab && (
          <Field label="Établissement" htmlFor="ue2">
            <select className="in" id="ue2" value={etab} onChange={e => setEtab(e.target.value)}>
              <option value="">— Choisir —</option>
              {etabs.map(x => <option key={x} value={x}>{x}</option>)}
            </select>
          </Field>
        )}
        <Button variant="primary" type="submit" disabled={busy}>Ajouter</Button>
      </form>

      <ul className="card mb-4 list-none p-4 text-sm">{ROLE_LIST.map(r => <li key={r}><b>{ROLES[r].label}</b> — {ROLES[r].description}</li>)}</ul>

      {loadError ? <p className="card p-4 text-sm text-red-600">Impossible de charger la liste.</p>
        : users === null ? <p className="text-sm text-[#6b7280]">Chargement…</p>
        : (
          <div className="card overflow-x-auto">
            <table className="t">
              <thead><tr><th>E-mail</th><th>Rôle</th><th>Ajouté par</th><th></th></tr></thead>
              <tbody>
                {rows.map(u => {
                  const fixed = u.email === BOOTSTRAP_ADMIN
                  const self = u.email === me
                  return (
                    <tr key={u.email}>
                      <td>{u.email}{self && <small>Vous</small>}</td>
                      <td>
                        {fixed ? 'Directeur (principal)' : (
                          <div className="flex flex-wrap gap-2">
                            <select className="in" aria-label={`Rôle de ${u.email}`} value={u.role} disabled={busy || self}
                              onChange={e => { const r = e.target.value as Role; void run(() => saveUser(u.email, r, me, ROLES[r].needsEtab ? u.etab ?? '' : ''), 'Rôle modifié') }}>
                              {ROLE_LIST.map(r => <option key={r} value={r}>{ROLES[r].label}</option>)}
                            </select>
                            {ROLES[u.role].needsEtab && (
                              <select className="in" aria-label={`Établissement de ${u.email}`} value={u.etab ?? ''} disabled={busy}
                                onChange={e => void run(() => saveUser(u.email, u.role, me, e.target.value), 'Établissement modifié')}>
                                <option value="">— Établissement —</option>
                                {etabs.map(x => <option key={x} value={x}>{x}</option>)}
                              </select>
                            )}
                          </div>
                        )}
                      </td>
                      <td>{u.addedBy ?? '—'}</td>
                      <td className="text-right">
                        {!fixed && !self && (
                          <Button size="sm" disabled={busy}
                            onClick={() => { if (confirm(`Retirer l'accès à ${u.email} ?`)) void run(() => removeUser(u.email), 'Accès retiré') }}>Retirer</Button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
    </Layout>
  )
}

export default Users
