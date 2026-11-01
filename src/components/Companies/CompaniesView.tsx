import type { CSSProperties } from 'react'
import Chip from '@/components/ui/Chip'
import SearchBox from '@/components/ui/SearchBox'
import PageHead from '@/components/ui/PageHead'
import { fd, fday, feur } from '@/helpers/dates'
import { FILTERS } from './constants'
import type { CompaniesViewProps } from './types'

/** Suivi des entreprises consultées (présentation seule) : devis attendus, déposés, et accès à leur portail de dépôt. */
const CompaniesView = ({ ui, model, onChange }: CompaniesViewProps) => (
  <>
    <PageHead
      title="Entreprises et devis"
      subtitle={`${model.total} entreprises · ${model.totalAttente} devis en attente de dépôt. Chaque entreprise dépose son devis depuis son portail personnel.`}
    />
    <div className="row mb-4 !gap-2.5">
      <SearchBox className="w-full sm:w-[280px]" value={ui.q} placeholder="Nom, ville, activité…" onChange={q => onChange({ q })} />
      {FILTERS.map(([k, l]) => <button key={k} className={`btn btn-sm ${ui.f === k ? 'btnp' : ''}`} onClick={() => onChange({ f: k })}>{l}</button>)}
    </div>
    {model.rows.length === 0 && <div className="card pad empty">Aucune entreprise ne correspond.</div>}
    <div className="stack" style={{ '--gap': '14px' } as CSSProperties}>
      {model.rows.map(({ e, attente, recus, retenus, docsOk, invitations }) => (
        <section key={e.id} className="card pad">
          <div className="row between mb-2.5">
            <div><h2 className="h2 m-0">{e.nom}</h2>
              <span className="muted s13">{e.activite} · {e.ville}</span></div>
            <div className="row !gap-2">
              {attente > 0 && <Chip tone="h48">{attente} devis attendu{attente > 1 ? 's' : ''}</Chip>}
              {recus > 0 && <Chip tone="ok">{recus} déposé{recus > 1 ? 's' : ''}</Chip>}
              {retenus > 0 && <Chip tone="ok">{retenus} retenu{retenus > 1 ? 's' : ''}</Chip>}
              {!docsOk && <Chip tone="ko">Documents à renouveler</Chip>}
            </div>
          </div>
          {invitations.length === 0
            ? <p className="muted s13 m-0">Aucune consultation en cours pour cette entreprise.</p>
            : (
              <div className="tbl-wrap">
                <table className="t min-w-[760px]">
                  <thead><tr><th>Consultation</th><th>Travaux</th><th>Limite de réponse</th><th>Devis</th><th></th></tr></thead>
                  <tbody>
                    {invitations.map(({ id, lots, ville, dateLimite, heureLimite, rep, closed }) => (
                      <tr key={id}>
                        <td><strong>{id}</strong></td>
                        <td>{lots}{ville ? <span className="muted"> · {ville}</span> : null}</td>
                        <td>{fday(dateLimite)} · {heureLimite}</td>
                        <td>
                          {rep.statut === 'recu' && <><Chip tone="ok">Déposé le {fd(rep.date)}</Chip> <strong>{feur(rep.montantHT)} HT</strong></>}
                          {rep.statut === 'decline' && <Chip tone="gr">Décliné{rep.motif ? ` · ${rep.motif}` : ''}</Chip>}
                          {rep.statut === 'attente' && (closed ? <Chip tone="gr">Clos sans réponse</Chip> : <Chip tone="h48">En attente</Chip>)}
                        </td>
                        <td className="whitespace-nowrap text-right">
                          <a className="btn btn-sm" href={`#/devis/${id}`}>Comparer</a>{' '}
                          <a className="btn btn-sm btnp" href={`#/portail/${id}/${e.id}`}>{rep.statut === 'attente' && !closed ? 'Déposer le devis' : 'Ouvrir le portail'}</a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </section>
      ))}
    </div>
  </>
)

export default CompaniesView
