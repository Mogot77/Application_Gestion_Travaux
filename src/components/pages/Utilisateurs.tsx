import { useEffect, useState, type FormEvent } from 'react'
import { useApp } from '../../hooks/useApp'
import { useAuth } from '../../hooks/useAuth'
import { Layout } from '../layout/Layout'
import { BOOTSTRAP_ADMIN, isEmail, normEmail, removeUser, saveUser, watchUsers, type AppUser, type Role } from '../../lib/users'

/** Gestion de la liste blanche des comptes Google autorisés (réservée aux administrateurs). */
export function Utilisateurs() {
  const { toast } = useApp()
  const { user, isAdmin } = useAuth()
  const me = normEmail(user?.email ?? '')
  const [users, setUsers] = useState<AppUser[] | null>(null)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role>('user')
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
    void run(async () => { await saveUser(mail, role, me); setEmail('') }, 'Utilisateur ajouté')
  }

  // L'administrateur d'origine apparaît toujours, même sans document.
  const rows: AppUser[] = users ? (users.some(u => u.email === BOOTSTRAP_ADMIN) ? users : [{ email: BOOTSTRAP_ADMIN, role: 'admin' }, ...users]) : []

  return (
    <Layout active="utilisateurs">
      <h1 className="mb-4 text-xl font-bold">Utilisateurs</h1>
      <form className="card mb-4 flex flex-wrap items-end gap-3 p-4" onSubmit={onAdd}>
        <div className="min-w-[240px] flex-1">
          <label className="lbl" htmlFor="ue">Compte Google (e-mail)</label>
          <input className="in" id="ue" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="prenom.nom@gmail.com" required />
        </div>
        <div>
          <label className="lbl" htmlFor="ur">Rôle</label>
          <select className="in" id="ur" value={role} onChange={e => setRole(e.target.value as Role)}>
            <option value="user">Utilisateur</option>
            <option value="admin">Administrateur</option>
          </select>
        </div>
        <button className="btn btnp" type="submit" disabled={busy}>Ajouter</button>
      </form>

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
                        {fixed ? 'Administrateur (principal)' : (
                          <select className="in" aria-label={`Rôle de ${u.email}`} value={u.role} disabled={busy || self}
                            onChange={e => void run(() => saveUser(u.email, e.target.value as Role, me), 'Rôle modifié')}>
                            <option value="user">Utilisateur</option>
                            <option value="admin">Administrateur</option>
                          </select>
                        )}
                      </td>
                      <td>{u.addedBy ?? '—'}</td>
                      <td className="text-right">
                        {!fixed && !self && (
                          <button className="btn btn-sm" type="button" disabled={busy}
                            onClick={() => { if (confirm(`Retirer l'accès à ${u.email} ?`)) void run(() => removeUser(u.email), 'Accès retiré') }}>Retirer</button>
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
