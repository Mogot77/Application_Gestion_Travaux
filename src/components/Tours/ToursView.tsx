import Icon from '@/components/ui/Icon'
import MapView from '@/components/MapView'
import { DAY_MAX } from '@/helpers/planning'
import { TODAY, fdayLong, fdur, initials, nowTime } from '@/helpers/dates'
import type { ToursViewProps } from './types'

/** Vue pure de l'écran Tournées : carte, équipes, urgence non affectée et trajets de l'ouvrier sélectionné. */
const ToursView = ({ model, hide, spec, onToggle, onSelectTeam, onAssign, onCalendar }: ToursViewProps) => {
  const { ouvs, ouvId, o, teams, urgent, legs } = model
  return (
    <>
      <div className="pagehead">
        <div className="t"><h1>Tournées et position des équipes</h1>
          <div className="seg w-auto"><button className="!px-3.5" onClick={onCalendar}>Calendrier</button><button className="on !px-3.5">Carte</button></div>
          <strong>{fdayLong(TODAY)} {TODAY.slice(0, 4)} · {nowTime()}</strong></div>
        <div className="row !gap-1.5">
          {ouvs.map(x => <button key={x.id} className={`tg${hide.includes(x.id) ? ' off' : ''}`} onClick={() => onToggle(x.id)}><i style={{ background: x.color }}></i>{x.nom}</button>)}
        </div>
      </div>
      <div className="cols">
        <section className="card min-w-0" style={{ flex: '999 1 620px' }}>
          <MapView spec={spec} mapKey="tour" />
          <div className="row between muted small px-3.5 py-2.5">
            <span>Rond coloré avec initiales : position estimée de l'équipe · rond numéroté : mission du jour (✓ réalisée, gris : non affectée) · D : dépôt ST · B : bureau Meaux</span>
            <span>Fond OpenStreetMap · bouton en haut à droite de la carte pour la vue satellite</span>
          </div>
        </section>
        <aside className="col-side">
          <div className="card pad"><h2 className="h2 mb-1.5">Équipes en ce moment</h2>
            {teams.map(({ o: x, txt, charge: c }) => (
              <div key={x.id} className={`team-row ${x.id === ouvId ? 'bg-brand-bg' : ''}`} onClick={() => onSelectTeam(x.id)}>
                <i className="av" style={{ background: x.color }}>{initials(x.nom)}</i>
                <div><strong>{x.nom}</strong> · {x.metier}<div className="muted small">{txt}</div></div>
                <span className={`small ${c > DAY_MAX ? 'font-bold text-danger' : ''}`}>{fdur(c)} / 7 h</span>
              </div>
            ))}
          </div>
          <div className={`card pad ${urgent ? '!border-danger-line !bg-danger-wash' : ''}`}>
            {urgent ? (
              <>
                <strong className="text-danger">Urgence non affectée · {urgent.ville}</strong>
                <p className="s13 mb-3 mt-1.5">{urgent.id} · {urgent.nature.toLowerCase()}. {urgent.nearest ? `Équipe la plus proche : ${urgent.nearest.nom}, ≈ ${urgent.nearest.min} min.` : "Aucune équipe disponible aujourd'hui."}</p>
                {urgent.nearest && <button className="btn btnp btn-w" onClick={() => onAssign(urgent.id, urgent.nearest!.id)}>Affecter à {urgent.nearest.nom}</button>}
              </>
            ) : (
              <><strong>Aucune urgence non affectée</strong><p className="muted s13 mb-0 mt-1.5">Les urgences à planifier apparaissent ici avec l'équipe la plus proche.</p></>
            )}
          </div>
          <div className="card pad"><div className="row between mb-2"><h2 className="h2">{o.nom} · tournée du jour</h2><span className="muted small">véhicule de service</span></div>
            <div className="tline"><span className="t">08:00</span><div>Départ dépôt · Vaux-le-Pénil</div></div>
            {legs.map(({ r, demandeId, nature, ville, trip }) => {
              const icon = { done: '✓ ', running: '▶ ', imp: '⚠ ', planned: '' }[r.etat]
              return (
                <div key={r.id}>
                  <div className="trip">{trip}</div>
                  <div className="tline"><span className="t">{r.debut}</span><div>{icon}<a href={`#/demande/${demandeId}`}>{demandeId.replace('2026-', '')}</a> · {nature} · {ville}</div></div>
                </div>
              )
            })}
            <p className="muted small mb-0 mt-2.5">Les trajets sont ajoutés automatiquement dans son agenda Outlook entre les rendez-vous.</p>
          </div>
        </aside>
      </div>
      <div className="note info mt-4"><Icon name="info" /><span><strong>Position des équipes estimée, sans suivi GPS :</strong> elle est déduite de la dernière mission démarrée ou terminée sur l'application mobile, et du trajet en cours. Un suivi GPS en temps réel reste possible en option, mais impose information des salariés, consultation du CSE et inscription au registre RGPD.</span></div>
    </>
  )
}

export default ToursView
