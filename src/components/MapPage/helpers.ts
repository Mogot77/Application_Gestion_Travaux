import type { AppState, Demande, Logement } from '@/types'
import type { MapMarker } from '@/components/MapView'
import { CLOSED, logAdr, profilOf, uniqueEtabs } from '@/helpers/domain'
import { DEPOT, approx, baseHtml, pinHtml, posLog } from '@/helpers/carto'
import { esc } from '@/helpers/dates'
import type { CrtUi, MapPageModel } from './types'

export const info = (S: AppState, l: Logement): { ds: Demande[]; urgent: boolean; color: string } => {
  const ds = S.demandes.filter(d => d.logementId === l.id && !CLOSED.includes(d.statut) && d.statut !== 'brouillon')
  const urgent = ds.some(d => d.urgence === 'urgent')
  return { ds, urgent, color: urgent ? '#B42318' : ds.length ? '#B54708' : '#6B7280' }
}

/** Données d'affichage de la carte : repères, compteurs, liste des demandes en cours et options de filtre. */
export const buildMapPageModel = (S: AppState, ui: CrtUi): MapPageModel => {
  const list = S.logements.filter(l => l.actif !== false
    && (S.profil !== 'etab' || l.etab === profilOf(S).etab || l.typo === 'BUR')
    && (!ui.dept || l.dept === ui.dept)
    && (!ui.etab || l.etab === ui.etab)
    && (ui.mode === 'tous' || (ui.mode === 'urgent' ? info(S, l).urgent : info(S, l).ds.length > 0)))
  const withD = list.filter(l => info(S, l).ds.length)

  const markers: MapMarker[] = [{ pos: DEPOT, html: baseHtml('D'), size: [26, 26], title: 'Dépôt ST · Vaux-le-Pénil' }]
  list.forEach(l => {
    const x = info(S, l)
    markers.push({
      pos: posLog(S, l), html: pinHtml(x.ds.length ? String(x.ds.length) : '', x.color, 28), size: [28, 28], title: `${l.id} · ${l.ville}`, z: x.urgent ? 500 : x.ds.length ? 300 : 0,
      popup: `<strong>${esc(l.id)}</strong> · ${esc(l.typo === 'BUR' ? 'Bureaux' : l.typo)}<br>${esc(logAdr(l))}, ${esc(l.cp)} ${esc(l.ville)}<br><span style="color:#5B6472">${esc(l.etab)}</span>${approx(l) ? '<br><span style="color:#B54708">Position approximative</span>' : ''}`
        + (x.ds.length ? '<div style="margin-top:6px">' + x.ds.map(d => `<a href="#/demande/${esc(d.id)}">${esc(d.id)}</a> · ${esc(d.lignes[0].nature)}`).join('<br>') + '</div>' : '')
        + `<div style="margin-top:8px"><a href="#/logement/${esc(l.id)}">Fiche logement</a> · <a href="#/demande/new?log=${esc(l.id)}">Nouvelle demande</a></div>`,
    })
  })

  return {
    total: list.length,
    withRequests: withD.length,
    urgent: list.filter(l => info(S, l).urgent).length,
    approx: list.filter(l => approx(l)).length,
    spec: { markers },
    refitKey: `${ui.dept}|${ui.etab}|${ui.mode}`,
    rows: withD.map(l => {
      const x = info(S, l)
      return { id: l.id, ville: l.ville, color: x.color, ids: x.ds.map(d => d.id.slice(-4)).join(', '), count: x.ds.length, urgent: x.urgent }
    }),
    etabs: S.profil !== 'etab' ? uniqueEtabs(S) : undefined,
    values: ui,
  }
}
