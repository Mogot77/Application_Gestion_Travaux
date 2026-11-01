import { useMemo } from 'react'
import type { AppState, Ouvrier } from '../../types'
import { useApp } from '../../hooks/useApp'
import { go } from '../../hooks/useRoute'
import { patchUi, useUiState } from '../../store/ui'
import { Layout } from '../layout/Layout'
import { MapView, type MapLine, type MapMarker, type MapSpec } from '../ui/MapView'
import { IcInfo } from '../ui/Icons'
import { DAY_MAX, PLAN_INIT, PLAN_KEY } from '../../lib/planning'
import { BUREAU, DEPOT, avatarHtml, baseHtml, km as dist, pinHtml, posLog, tripMin, type LatLng } from '../../lib/carto'
import { chargeOf, firstFree, getD, getLog, logAdr, ouvActifs, rdvsOf } from '../../lib/domain'
import { TODAY, esc, fdayLong, fdur, ftime, initials, nowTime, toMin, toTime, weekStart } from '../../lib/dates'

interface TourUi { hide: string[]; ouv: string }
const TOUR_KEY = 'tour'
const TOUR_INIT: TourUi = { hide: [], ouv: 'o1' }

interface TeamState { pos: LatLng; txt: string; busy: boolean }

const teamState = (S: AppState, o: Ouvrier): TeamState => {
  const list = rdvsOf(S, o.id, TODAY).filter(r => r.demandeId)
  const run = list.find(r => r.etat === 'running')
  const done = list.filter(r => r.etat === 'done' || r.etat === 'imp')
  const next = list.find(r => r.etat === 'planned')
  const logOf = (demandeId?: string) => getLog(S, getD(S, demandeId)?.logementId)
  if (run) { const l = logOf(run.demandeId); return { pos: posLog(S, l?.id || ''), txt: `En mission depuis ${ftime(run.debutReel) || run.debut} · ${l?.ville}`, busy: true } }
  const last = done[done.length - 1]
  if (last) {
    const l = logOf(last.demandeId)
    if (next) {
      const ln = logOf(next.demandeId)
      const a = posLog(S, l?.id || ''), b = posLog(S, ln?.id || '')
      return { pos: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], txt: `En trajet vers ${ln?.ville} · rdv ${next.debut}`, busy: true }
    }
    return { pos: posLog(S, l?.id || ''), txt: `Dernière fin ${ftime(last.finReel) || toTime(toMin(last.debut) + last.duree)} · ${l?.ville}`, busy: false }
  }
  if (next) return { pos: DEPOT, txt: `Au dépôt · prochain rdv ${next.debut} à ${logOf(next.demandeId)?.ville}`, busy: false }
  return { pos: DEPOT, txt: 'Au dépôt', busy: false }
}

/** Contenu de la carte : missions du jour par ouvrier, trajets de l'ouvrier sélectionné, positions estimées des équipes. */
const mapSpec = (S: AppState, ouvs: Ouvrier[], hide: string[], tour: string, selectTeam: (id: string) => void): MapSpec => {
  const markers: MapMarker[] = [
    { pos: DEPOT, html: baseHtml('D'), size: [26, 26], title: 'Dépôt ST · Vaux-le-Pénil' },
    { pos: BUREAU, html: baseHtml('B'), size: [26, 26], title: 'Bureau · Meaux' },
  ]
  const lines: MapLine[] = []
  ouvs.forEach((o, k) => {
    if (hide.includes(o.id)) return
    const list = rdvsOf(S, o.id, TODAY).filter(r => r.demandeId)
    list.forEach((r, i) => {
      const d = getD(S, r.demandeId)
      const log = getLog(S, d?.logementId)
      if (!d || !log) return
      const lbl = r.etat === 'done' ? '✓' : r.etat === 'imp' ? '!' : String(i + 1)
      const fill = r.etat === 'done' ? '#9CA3AF' : r.etat === 'imp' ? '#B42318' : o.color
      markers.push({
        pos: posLog(S, log), html: pinHtml(lbl, fill, 26), size: [26, 26], title: `${d.id} · ${d.lignes[0].nature}`,
        popup: `<strong>${esc(d.id)}</strong> · ${esc(r.debut)}<br>${esc(log.id)} · ${esc(logAdr(log))}, ${esc(log.ville)}<br>${esc(d.lignes[0].piece)} — ${esc(d.lignes[0].nature)}<br><span style="color:#5B6472">${esc(o.nom)}</span><br><a href="#/demande/${esc(d.id)}">Ouvrir la demande</a>`,
      })
    })
    if (o.id === tour) {
      const pts: LatLng[] = [DEPOT, ...list.map(r => posLog(S, getD(S, r.demandeId)?.logementId || ''))]
      for (let i = 1; i < pts.length; i++) {
        const k2 = dist(pts[i - 1], pts[i])
        lines.push({ pts: [pts[i - 1], pts[i]], color: o.color, dashed: true, label: k2 > 2 ? `${tripMin(k2)} min · ${Math.round(k2)} km` : '' })
      }
    }
    const st = teamState(S, o)
    const ang = -Math.PI / 2 + k * (2 * Math.PI / ouvs.length), dx = Math.cos(ang) * 27, dy = Math.sin(ang) * 27 // décalage en pixels : équipes au même endroit restent lisibles
    markers.push({ pos: st.pos, html: avatarHtml(initials(o.nom), o.color), size: [34, 34], anchor: [17 - dx, 17 - dy], z: 1000, title: `${o.nom} · ${st.txt}`, onClick: () => selectTeam(o.id) })
  })
  S.demandes.filter(d => ['a_planifier', 'acces_impossible'].includes(d.statut) && d.urgence !== 'prog').forEach(d => {
    markers.push({ pos: posLog(S, d.logementId), html: pinHtml(d.urgence === 'urgent' ? '!' : '·', '#6B7280', 26), size: [26, 26], title: `${d.id} · non affectée`, popup: `<strong>${esc(d.id)}</strong> · non affectée<br><a href="#/planning?sel=${esc(d.id)}">Planifier</a>` })
  })
  return { markers, lines }
}

export function Tournees() {
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
      <div className="note info mt-4"><IcInfo /><span><strong>Position des équipes estimée, sans suivi GPS :</strong> elle est déduite de la dernière mission démarrée ou terminée sur l'application mobile, et du trajet en cours. Un suivi GPS en temps réel reste possible en option, mais impose information des salariés, consultation du CSE et inscription au registre RGPD.</span></div>
    </Layout>
  )
}
