import Chip from '@/components/ui/Chip'
import Empty from '@/components/ui/Empty'
import { PhotoView } from '@/components/Photo'
import { batiCls, propCls } from '@/helpers/domain'
import { fd } from '@/helpers/dates'
import type { InspectionsTableViewProps } from './types'

/** Tableau des constats d'état (présentation seule : les lignes sont préparées par le conteneur). */
const InspectionsTableView = ({ rows, withLog, onOpenPhoto, onNoFollowUp }: InspectionsTableViewProps) => {
  if (!rows.length) return <Empty>Aucun constat</Empty>
  return (
    <table className={`t ${withLog ? 'min-w-[1000px]' : 'min-w-[820px]'}`}>
      <thead><tr><th>Date</th>{withLog && <th>Logement</th>}<th>Auteur</th><th>Contexte</th><th>Propreté /6</th><th>Bâti</th><th>Signalements</th><th>Photos</th><th>Suite donnée</th></tr></thead>
      <tbody>
        {rows.map(({ c, logement, alert }) => (
          <tr key={c.id}>
            <td>{fd(c.date)}</td>
            {withLog && <td><a href={`#/logement/${logement?.id}`}>{logement?.id}</a><small>{logement?.ville} · {logement?.typo}</small></td>}
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
                {c.photos.slice(0, 3).map((p, i) => <PhotoView key={i} src={p} w={36} h={28} onOpen={onOpenPhoto} />)}
                {c.photos.length > 3 && <span className="muted small">+{c.photos.length - 3}</span>}
                {!c.photos.length && <span className="muted">0</span>}
              </div>
            </td>
            <td>
              {c.demandeId ? <><a href={`#/demande/${c.demandeId}`}>{c.demandeId}</a><small>créée depuis le constat</small></>
                : c.suite === 'aucune' ? <span className="muted">Aucune</span>
                  : (
                    <>
                      {alert ? <><Chip tone="bad">Alerte coordination</Chip><br /></> : <><span className="muted">À examiner</span><br /></>}
                      <div className="row mt-1 !gap-1.5">
                        <a className="small" href={`#/demande/new?log=${c.logementId}&constat=${c.id}`}>Créer une demande</a>
                        <button className="linkbtn small" onClick={() => onNoFollowUp(c.id)}>Sans suite</button>
                      </div>
                    </>
                  )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default InspectionsTableView
