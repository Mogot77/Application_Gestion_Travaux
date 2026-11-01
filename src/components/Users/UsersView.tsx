import Button from '@/components/ui/Button'
import Field from '@/components/ui/Field'
import { ROLES, ROLE_LIST, type Role } from '@/helpers/roles'
import type { UsersViewProps } from './types'

/** Gestion de la liste blanche des comptes Google autorisés (vue). */
const UsersView = ({ status, rows, etabs, form, busy, onFormChange, onAdd, onChangeRole, onChangeEtab, onRemove }: UsersViewProps) => {
  if (status === 'forbidden') return <p className="card p-6 text-sm">Cette page est réservée aux administrateurs.</p>
  return (
    <>
      <h1 className="mb-4 text-xl font-bold">Utilisateurs</h1>
      <form className="card mb-4 flex flex-wrap items-end gap-3 p-4" onSubmit={e => { e.preventDefault(); onAdd() }}>
        <Field label="Compte Google (e-mail)" htmlFor="ue" className="min-w-[240px] flex-1">
          <input className="in" id="ue" type="email" value={form.email} onChange={e => onFormChange({ email: e.target.value })} placeholder="prenom.nom@gmail.com" required />
        </Field>
        <Field label="Rôle" htmlFor="ur">
          <select className="in" id="ur" value={form.role} onChange={e => onFormChange({ role: e.target.value as Role })}>
            {ROLE_LIST.map(r => <option key={r} value={r}>{ROLES[r].label}</option>)}
          </select>
        </Field>
        {ROLES[form.role].needsEtab && (
          <Field label="Établissement" htmlFor="ue2">
            <select className="in" id="ue2" value={form.etab} onChange={e => onFormChange({ etab: e.target.value })}>
              <option value="">— Choisir —</option>
              {etabs.map(x => <option key={x} value={x}>{x}</option>)}
            </select>
          </Field>
        )}
        <Button variant="primary" type="submit" disabled={busy}>Ajouter</Button>
      </form>

      <ul className="card mb-4 list-none p-4 text-sm">{ROLE_LIST.map(r => <li key={r}><b>{ROLES[r].label}</b> — {ROLES[r].description}</li>)}</ul>

      {status === 'error' ? <p className="card p-4 text-sm text-red-600">Impossible de charger la liste.</p>
        : status === 'loading' ? <p className="text-sm text-muted">Chargement…</p>
        : (
          <div className="card overflow-x-auto">
            <table className="t">
              <thead><tr><th>E-mail</th><th>Rôle</th><th>Ajouté par</th><th></th></tr></thead>
              <tbody>
                {rows.map(u => (
                  <tr key={u.email}>
                    <td>{u.email}{u.self && <small>Vous</small>}</td>
                    <td>
                      {u.fixed ? 'Directeur (principal)' : (
                        <div className="flex flex-wrap gap-2">
                          <select className="in" aria-label={`Rôle de ${u.email}`} value={u.role} disabled={busy || u.self}
                            onChange={e => onChangeRole(u.email, e.target.value as Role)}>
                            {ROLE_LIST.map(r => <option key={r} value={r}>{ROLES[r].label}</option>)}
                          </select>
                          {ROLES[u.role].needsEtab && (
                            <select className="in" aria-label={`Établissement de ${u.email}`} value={u.etab ?? ''} disabled={busy}
                              onChange={e => onChangeEtab(u.email, e.target.value)}>
                              <option value="">— Établissement —</option>
                              {etabs.map(x => <option key={x} value={x}>{x}</option>)}
                            </select>
                          )}
                        </div>
                      )}
                    </td>
                    <td>{u.addedBy ?? '—'}</td>
                    <td className="text-right">
                      {!u.fixed && !u.self && (
                        <Button size="sm" disabled={busy} onClick={() => onRemove(u.email)}>Retirer</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </>
  )
}

export default UsersView
