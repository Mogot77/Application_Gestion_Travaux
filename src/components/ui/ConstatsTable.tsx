import type { Constat } from '../../types'
import { useApp } from '../../hooks/useApp'
import { Chip } from './Chip'
import { Photo } from './Photo'
import { batiCls, getLog, isAlert, propCls } from '../../lib/domain'
import { fd } from '../../lib/dates'


export function ConstatsTable({ list, withLog }: { list: Constat[]; withLog: boolean }) {
  const { S, mutate, toast } = useApp()
  if (!list.length) return <div className="empty">Aucun constat</div>
  const sansSuite = (id: string) => {
    mutate(s => { const c = s.constats.find(x => x.id === id); if (c) c.suite = 'aucune' }, { now: true })
    toast('Constat classé sans suite')
  }
  return (
    <table className={`t ${withLog ? 'min-w-[1000px]' : 'min-w-[820px]'}`}>
      <thead><tr><th>Date</th>{withLog && <th>Logement</th>}<th>Auteur</th><th>Contexte</th><th>Propreté /6</th><th>Bâti</th><th>Signalements</th><th>Photos</th><th>Suite donnée</th></tr></thead>
      <tbody>
        {list.map(c => {
          const l = getLog(S, c.logementId)
          return (
            <tr key={c.id}>
              <td>{fd(c.date)}</td>
              {withLog && <td><a href={`#/logement/${l?.id}`}>{l?.id}</a><small>{l?.ville} · {l?.typo}</small></td>}
              <td>{c.auteur}<small>{c.fonction}</small></td>
              <td>{c.contexte}</td>
              <td><Chip tone={propCls(c.proprete)}>{c.proprete} / 6</Chip></td>
              <td><Chip tone={batiCls(c.bati)}>{c.bati}</Chip></td>
              <td className="max-w-[300px]">
                {c.signalements.map(s => <span key={s} className="tag">{s}</span>)}
                {!c.signalements.length && <span className="muted">—</span>}
                {c.commentaire && <small>{c.commentaire}</small>}
              </td>
              <td>
                <div className="row flex-nowrap !gap-1">
                  {c.photos.slice(0, 3).map((p, i) => <Photo key={i} src={p} w={36} h={28} />)}
                  {c.photos.length > 3 && <span className="muted small">+{c.photos.length - 3}</span>}
                  {!c.photos.length && <span className="muted">0</span>}
                </div>
              </td>
              <td>
                {c.demandeId ? <><a href={`#/demande/${c.demandeId}`}>{c.demandeId}</a><small>créée depuis le constat</small></>
                  : c.suite === 'aucune' ? <span className="muted">Aucune</span>
                    : (
                      <>
                        {isAlert(c) ? <><Chip tone="bad">Alerte coordination</Chip><br /></> : <><span className="muted">À examiner</span><br /></>}
                        <div className="row mt-1 !gap-1.5">
                          <a className="small" href={`#/demande/new?log=${c.logementId}&constat=${c.id}`}>Créer une demande</a>
                          <button className="linkbtn small" onClick={() => sansSuite(c.id)}>Sans suite</button>
                        </div>
                      </>
                    )}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
