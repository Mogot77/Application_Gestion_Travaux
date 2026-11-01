import { useMemo } from 'react'
import type { Ouvrier } from '@/types'
import Icon from '@/components/ui/Icon'
import Layout from '@/components/Layout'
import MapView from '@/components/MapView'
import { useApp } from '@/hooks/useApp'
import { go } from '@/hooks/useRoute'
import { useUiState } from '@/hooks/useUiState'
import { patchUi } from '@/store/local/uiState'
import { DAY_MAX, PLAN_INIT, PLAN_KEY } from '@/helpers/planning'
import { DEPOT, posLog } from '@/helpers/carto'
import { chargeOf, firstFree, getD, getLog, ouvActifs, rdvsOf } from '@/helpers/domain'
import { TODAY, fdayLong, fdur, initials, nowTime, weekStart } from '@/helpers/dates'
import { TOUR_INIT, TOUR_KEY } from './constants'
import { km as dist, mapSpec, teamState, tripMin } from './helpers'
import type { TourUi } from './types'

const Tours = () => {
  const { S } = useApp()
  const [ui, setUi] = useUiState<TourUi>(TOUR_KEY, TOUR_INIT)
  const ouvs = ouvActifs(S)
  const ouvId = ouvs.some(x => x.id === ui.ouv) ? ui.ouv : (ouvs.length ? ouvs[0].id : '')
  const o = ouvs.find(x => x.id === ouvId) || { id: '', nom: 'Aucun ouvrier actif', metier: '', color: '#9AA3B0' }
  const tourList = rdvsOf(S, o.id, TODAY).filter(r => r.demandeId)
  const urgent = S.demandes.filter(d => ['a_planifier', 'acces_impossible'].includes(d.statut) && d.urgence === 'urgent')[0]
  let nearest: { o: Ouvrier; km: number } | undefined
  if (urgent) {
    const p = posLog(S, urgent.logementId)
    nearest = ouvs.filter(x => chargeOf(S, x.id, TODAY) < DAY_MAX).map(x => ({ o: x, km: dist(teamState(S, x).pos, p) })).sort((a, b) => a.km - b.km)[0]
  }

  const spec = useMemo(() => mapSpec(S, ouvs, ui.hide, ouvId, id => setUi({ ouv: id })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [S, ui.hide, ouvId])

  const toggle = (id: string) => setUi({ hide: ui.hide.includes(id) ? ui.hide.filter(x => x !== id) : [...ui.hide, id] })
  const affecter = (demandeId: string, ouvrierId: string) => {
    patchUi(PLAN_KEY, PLAN_INIT, { demandeId, rdvSel: '', ouvrierId, date: TODAY, debut: firstFree(S, ouvrierId, TODAY), lastQ: demandeId, week: weekStart(TODAY) })
    go('#/planning')
  }

  // trajets successifs : dépôt puis chaque mission du jour
  const legs = tourList.map((r, i) => {
    const from = i === 0 ? DEPOT : posLog(S, getD(S, tourList[i - 1].demandeId)?.logementId || '')
    return { r, k: dist(from, posLog(S, getD(S, r.demandeId)?.logementId || '')) }
  })

  return (
    <Layout active="planning">
      <div className="pagehead">
        <div className="t"><h1>Tournées et position des équipes</h1>
          <div className="seg w-auto"><button className="!px-3.5" onClick={() => go('#/planning')}>Calendrier</button><button className="on !px-3.5">Carte</button></div>
          <strong>{fdayLong(TODAY)} {TODAY.slice(0, 4)} · {nowTime()}</strong></div>
        <div className="row !gap-1.5">
          {ouvs.map(x => <button key={x.id} className={`tg${ui.hide.includes(x.id) ? ' off' : ''}`} onClick={() => toggle(x.id)}><i style={{ background: x.color }}></i>{x.nom}</button>)}
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
            {ouvs.map(x => {
              const st = teamState(S, x); const c = chargeOf(S, x.id, TODAY)
              return (
                <div key={x.id} className={`team-row ${x.id === ouvId ? 'bg-brand-bg' : ''}`} onClick={() => setUi({ ouv: x.id, hide: ui.hide.filter(h => h !== x.id) })}>
                  <i className="av" style={{ background: x.color }}>{initials(x.nom)}</i>
                  <div><strong>{x.nom}</strong> · {x.metier}<div className="muted small">{st.txt}</div></div>
                  <span className={`small ${c > DAY_MAX ? 'font-bold text-danger' : ''}`}>{fdur(c)} / 7 h</span>
                </div>
              )
            })}
          </div>
          <div className={`card pad ${urgent ? '!border-danger-line !bg-[#FFFBFA]' : ''}`}>
            {urgent ? (
              <>
                <strong className="text-danger">Urgence non affectée · {getLog(S, urgent.logementId)?.ville}</strong>
                <p className="s13 mb-3 mt-1.5">{urgent.id} · {urgent.lignes[0].nature.toLowerCase()}. {nearest ? `Équipe la plus proche : ${nearest.o.nom}, ≈ ${tripMin(nearest.km)} min.` : "Aucune équipe disponible aujourd'hui."}</p>
                {nearest && <button className="btn btnp btn-w" onClick={() => affecter(urgent.id, nearest.o.id)}>Affecter à {nearest.o.nom}</button>}
              </>
            ) : (
              <><strong>Aucune urgence non affectée</strong><p className="muted s13 mb-0 mt-1.5">Les urgences à planifier apparaissent ici avec l'équipe la plus proche.</p></>
            )}
          </div>
          <div className="card pad"><div className="row between mb-2"><h2 className="h2">{o.nom} · tournée du jour</h2><span className="muted small">véhicule de service</span></div>
            <div className="tline"><span className="t">08:00</span><div>Départ dépôt · Vaux-le-Pénil</div></div>
            {legs.map(({ r, k }) => {
              const d = getD(S, r.demandeId)
              if (!d) return null
              const icon = { done: '✓ ', running: '▶ ', imp: '⚠ ', planned: '' }[r.etat]
              return (
                <div key={r.id}>
                  <div className="trip">{k > 1 ? `Trajet estimé ${tripMin(k)} min · ${Math.round(k)} km` : 'Même secteur'}</div>
                  <div className="tline"><span className="t">{r.debut}</span><div>{icon}<a href={`#/demande/${d.id}`}>{d.id.replace('2026-', '')}</a> · {d.lignes[0].nature} · {getLog(S, d.logementId)?.ville}</div></div>
                </div>
              )
            })}
            <p className="muted small mb-0 mt-2.5">Les trajets sont ajoutés automatiquement dans son agenda Outlook entre les rendez-vous.</p>
          </div>
        </aside>
      </div>
      <div className="note info mt-4"><Icon name="info" /><span><strong>Position des équipes estimée, sans suivi GPS :</strong> elle est déduite de la dernière mission démarrée ou terminée sur l'application mobile, et du trajet en cours. Un suivi GPS en temps réel reste possible en option, mais impose information des salariés, consultation du CSE et inscription au registre RGPD.</span></div>
    </Layout>
  )
}

export default Tours
