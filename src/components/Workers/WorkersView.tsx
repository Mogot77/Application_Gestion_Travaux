import Chip from '@/components/ui/Chip'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Note from '@/components/ui/Note'
import SearchBox from '@/components/ui/SearchBox'
import PageHead from '@/components/ui/PageHead'
import { fdur, initials } from '@/helpers/dates'
import type { WorkersViewProps } from './types'

/** Vue pure de l'écran Ouvriers : tout passe par les props. */
const WorkersView = ({ model, q, showInactive, onQuery, onShowInactive, onCreate, onEdit, onToggle, onDelete }: WorkersViewProps) => {
  const { rows, total, nActifs, nInactifs, can } = model
  return (
    <>
      <PageHead
        title="Ouvriers du service technique"
        subtitle={<>{nActifs} actif{nActifs > 1 ? 's' : ''}{nInactifs ? ` · ${nInactifs} désactivé${nInactifs > 1 ? 's' : ''}` : ''}. Les ouvriers actifs apparaissent dans le planning et la carte des tournées.</>}
      >
        {can && <Button variant="primary" onClick={onCreate}>+ Nouvel ouvrier</Button>}
      </PageHead>
      {!can && <Note className="mb-4">Lecture seule pour les établissements.</Note>}
      <div className="row mb-4 !gap-2.5">
        <SearchBox className="w-full sm:w-[280px]" value={q} placeholder="Nom, métier, téléphone…" onChange={onQuery} />
        {nInactifs > 0 && <label className="row s13 !gap-1.5"><input type="checkbox" checked={showInactive} onChange={e => onShowInactive(e.target.checked)} /> Afficher les ouvriers désactivés</label>}
      </div>
      <Card className="tbl-wrap">
        <table className="t min-w-[900px]">
          <thead><tr><th></th><th>Nom</th><th>Métier</th><th>Téléphone</th><th>E-mail</th><th>Cette semaine</th><th>À venir</th><th>Statut</th><th></th></tr></thead>
          <tbody>
            {rows.map(({ o, stats: s }) => {
              const off = o.actif === false
              return (
                <tr key={o.id} className={off ? 'opacity-60' : ''}>
                  <td className="w-11"><i className="av" style={{ background: o.color }}>{initials(o.nom)}</i></td>
                  <td><strong>{o.nom}</strong></td>
                  <td>{o.metier || '—'}</td>
                  <td>{o.tel || '—'}</td>
                  <td>{o.email ? o.email : <span className="muted">—</span>}</td>
                  <td>{fdur(s.week)} / 35 h</td>
                  <td>{s.avenir} rdv</td>
                  <td>{off ? <Chip>Désactivé</Chip> : <Chip tone="ok">Actif</Chip>}</td>
                  <td className="whitespace-nowrap text-right">
                    {can && (
                      <>
                        <Button size="sm" onClick={() => onEdit(o)}>Modifier</Button>{' '}
                        <Button size="sm" onClick={() => onToggle(o)}>{off ? 'Réactiver' : 'Désactiver'}</Button>{' '}
                        <Button size="sm" variant="danger" onClick={() => onDelete(o)}>Supprimer</Button>
                      </>
                    )}
                  </td>
                </tr>
              )
            })}
            {!rows.length && <tr><td colSpan={9} className="empty">{total ? 'Aucun ouvrier ne correspond.' : 'Aucun ouvrier. Cliquez sur « + Nouvel ouvrier » pour commencer.'}</td></tr>}
          </tbody>
        </table>
      </Card>
      <p className="muted small mt-3">Un ouvrier qui a déjà des rendez-vous ne peut pas être supprimé (son historique et ses rapports restent liés) : désactivez-le. Un ouvrier avec des rendez-vous à venir doit d'abord être remplacé sur le planning.</p>
    </>
  )
}

export default WorkersView
