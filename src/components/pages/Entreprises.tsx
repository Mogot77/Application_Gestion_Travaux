import { useApp } from '../../hooks/useApp'
import { useUiState } from '../../store/ui'
import { Layout } from '../layout/Layout'
import { Chip } from '../ui/Chip'
import { IcSearch } from '../ui/Icons'
import { getD, getLog, shortLot } from '../../lib/domain'
import { statsOf } from '../../lib/entreprises'
import { fd, fday, feur } from '../../lib/dates'

const FILTERS: [string, string][] = [['', 'Toutes'], ['attente', 'Devis attendu'], ['recu', 'Devis déposé'], ['docs', 'Documents à renouveler']]

/** Suivi des entreprises consultées : devis attendus, déposés, et accès à leur portail de dépôt. */
export function Entreprises() {
  const { S } = useApp()
  const [ui, setUi] = useUiState<{ q: string; f: string }>('ent', { q: '', f: '' })
  const q = ui.q.toLowerCase()
  const rows = S.entreprises
    .map(e => ({ e, st: statsOf(S, e) }))
    .filter(({ e, st }) => (!q || `${e.nom} ${e.ville} ${e.activite}`.toLowerCase().includes(q))
      && (!ui.f || (ui.f === 'attente' && st.attente > 0) || (ui.f === 'recu' && st.recus > 0) || (ui.f === 'docs' && !st.docsOk)))
  const totalAttente = S.entreprises.reduce((n, e) => n + statsOf(S, e).attente, 0)

  return (
    <Layout active="entreprises">
      <div className="pagehead">
        <div><h1 className="mb-1">Entreprises et devis</h1>
          <p className="muted m-0">{S.entreprises.length} entreprises · {totalAttente} devis en attente de dépôt. Chaque entreprise dépose son devis depuis son portail personnel.</p></div>
      </div>
      <div className="row mb-4 !gap-2.5">
        <label className="flt w-[280px] cursor-text"><IcSearch />
          <input className="min-w-0 flex-1 border-0 outline-0" style={{ font: 'inherit' }} value={ui.q} placeholder="Nom, ville, activité…" onChange={e => setUi({ q: e.target.value })} />
        </label>
        {FILTERS.map(([k, l]) => <button key={k} className={`btn btn-sm ${ui.f === k ? 'btnp' : ''}`} onClick={() => setUi({ f: k })}>{l}</button>)}
      </div>
      {rows.length === 0 && <div className="card pad empty">Aucune entreprise ne correspond.</div>}
      <div className="stack" style={{ '--gap': '14px' } as React.CSSProperties}>
        {rows.map(({ e, st }) => (
          <section key={e.id} className="card pad">
            <div className="row between mb-2.5">
              <div><h2 className="h2 m-0">{e.nom}</h2>
                <span className="muted s13">{e.activite} · {e.ville}</span></div>
              <div className="row !gap-2">
                {st.attente > 0 && <Chip tone="h48">{st.attente} devis attendu{st.attente > 1 ? 's' : ''}</Chip>}
                {st.recus > 0 && <Chip tone="ok">{st.recus} déposé{st.recus > 1 ? 's' : ''}</Chip>}
                {st.retenus > 0 && <Chip tone="ok">{st.retenus} retenu{st.retenus > 1 ? 's' : ''}</Chip>}
                {!st.docsOk && <Chip tone="ko">Documents à renouveler</Chip>}
              </div>
            </div>
            {st.invitations.length === 0
              ? <p className="muted s13 m-0">Aucune consultation en cours pour cette entreprise.</p>
              : (
                <div className="tbl-wrap">
                  <table className="t min-w-[760px]">
                    <thead><tr><th>Consultation</th><th>Travaux</th><th>Limite de réponse</th><th>Devis</th><th></th></tr></thead>
                    <tbody>
                      {st.invitations.map(({ cs, rep, closed }) => {
                        const d = getD(S, cs.demandeId)
                        const log = getLog(S, d?.logementId)
                        const lots = d ? cs.lignes.map(i => shortLot(d.lignes[i]?.lot)).filter((v, i, a) => v && a.indexOf(v) === i).join(' et ') : '—'
                        return (
                          <tr key={cs.id}>
                            <td><strong>{cs.id}</strong></td>
                            <td>{lots}{log ? <span className="muted"> · {log.ville}</span> : null}</td>
                            <td>{fday(cs.dateLimite)} · {cs.heureLimite}</td>
                            <td>
                              {rep.statut === 'recu' && <><Chip tone="ok">Déposé le {fd(rep.date)}</Chip> <strong>{feur(rep.montantHT)} HT</strong></>}
                              {rep.statut === 'decline' && <Chip tone="gr">Décliné{rep.motif ? ` · ${rep.motif}` : ''}</Chip>}
                              {rep.statut === 'attente' && (closed ? <Chip tone="gr">Clos sans réponse</Chip> : <Chip tone="h48">En attente</Chip>)}
                            </td>
                            <td className="whitespace-nowrap text-right">
                              <a className="btn btn-sm" href={`#/devis/${cs.id}`}>Comparer</a>{' '}
                              <a className="btn btn-sm btnp" href={`#/portail/${cs.id}/${e.id}`}>{rep.statut === 'attente' && !closed ? 'Déposer le devis' : 'Ouvrir le portail'}</a>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
          </section>
        ))}
      </div>
    </Layout>
  )
}
