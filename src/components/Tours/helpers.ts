import type { AppState, Ouvrier } from '@/types'
import type { MapLine, MapMarker, MapSpec } from '@/components/MapView'
import { DEPOT, baseHtml, pinHtml, posLog, type LatLng } from '@/helpers/carto'
import { getD, getLog, logAdr, rdvsOf } from '@/helpers/domain'
import { TODAY, esc, ftime, initials, toMin, toTime } from '@/helpers/dates'
import type { TeamState } from './types'
import { BUREAU } from './constants'

export const km = (a: LatLng, b: LatLng) => { // distance à vol d'oiseau × 1,3 ≈ distance routière
  const r = Math.PI / 180, dLa = (b[0] - a[0]) * r, dLo = (b[1] - a[1]) * r
  const x = Math.sin(dLa / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLo / 2) ** 2
  return 6371 * 2 * Math.asin(Math.sqrt(x)) * 1.3
}
export const tripMin = (k: number) => Math.round(k / 35 * 60 + (k ? 5 : 0))

export const avatarHtml = (txt: string, color: string) => `<div class="cm-av" style="background:${color}">${esc(txt)}</div>`

export const teamState = (S: AppState, o: Ouvrier): TeamState => {
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
export const mapSpec = (S: AppState, ouvs: Ouvrier[], hide: string[], tour: string, selectTeam: (id: string) => void): MapSpec => {
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
        const k2 = km(pts[i - 1], pts[i])
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

