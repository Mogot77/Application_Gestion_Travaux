import type { AppState, Demande, Logement } from '@/types'
import type { MapFocus, MapSpec } from '@/components/MapView'
import { statInfo } from '@/components/StatusChip/helpers'
import { isAlert } from '@/components/InspectionsTable/helpers'
import { logFolder } from '@/components/HousingTree/helpers'
import { CLOSED, QUALIF, STAT, batiCls, circuitOf, getLog, logAdr, nextRdv, piecesFor, profilOf, propCls, typoLabel, uniqueEtabs } from '@/helpers/domain'
import { TODAY, diffDays, fd, fdy, slug } from '@/helpers/dates'
import { docsFor } from '@/helpers/docs'
import { DEPOT, approx, baseHtml, pinHtml, posLog } from '@/helpers/carto'
import type { LatLng } from '@/helpers/carto'
import type {
  HousingDetailModel, HousingListGroup, HousingModel, InterventionRow, LogTab, LogUi,
} from './types'

/** Géocodage d'adresse (Nominatim / OpenStreetMap). */
export const geocode = async (adresse: string, cp: string, ville: string): Promise<LatLng | null> => {
  const q = `${adresse}, ${cp} ${ville}, France`
  const r = await fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=fr&q=' + encodeURIComponent(q), { headers: { Accept: 'application/json' } })
  if (!r.ok) throw new Error('Service de géocodage indisponible')
  const j = await r.json() as { lat: string; lon: string }[]
  return j.length ? [Number(j[0].lat), Number(j[0].lon)] : null
}

/** Résumé en une ligne de l'activité en cours sur un logement. */
export const resume = (S: AppState, l: Logement): string => {
  const ds = S.demandes.filter(d => d.logementId === l.id && !CLOSED.includes(d.statut) && d.statut !== 'brouillon')
  const c = S.constats.filter(x => x.logementId === l.id).sort((a, b) => b.date.localeCompare(a.date))[0]
  if (ds.some(d => d.statut === 'en_cours')) return 'intervention en cours'
  if (ds.some(d => d.statut === 'a_reactualiser')) return 'demande à réactualiser'
  if (ds.some(d => QUALIF.includes(d.statut))) return `${ds.length} demande${ds.length > 1 ? 's' : ''} dont à qualifier`
  if (ds.length) return `${ds.length} demande${ds.length > 1 ? 's' : ''} en cours`
  if (c && c.proprete <= 2) return `constat « ${S.ref.proprete[c.proprete].toLowerCase()} » le ${fd(c.date)}`
  return 'aucune demande en cours'
}

/** Lignes du tableau des interventions (date réelle ou prévue, circuit, imputation, statut). */
export const buildInterventionRows = (S: AppState, ds: Demande[]): InterventionRow[] => ds.map(d => {
  const r = nextRdv(S, d)
  const di = r ? r.date : d.dateIntervention || ''
  const [statusLabel, statusTone] = statInfo(S, d)
  return {
    id: d.id,
    date: di ? fd(di) + (di > TODAY || d.statut === 'planifiee' ? ' (prévue)' : '') : '',
    requestDate: fd(d.recueLe),
    pieces: d.lignes.map(l => l.piece).filter((v, i, a) => a.indexOf(v) === i).join(', '),
    natures: d.lignes.map(l => l.nature).join(', '),
    circuit: circuitOf(S, d) || '—',
    imputation: [...new Set(d.lignes.map(l => l.imputation.replace(' (refacturation)', '')))].join(' / '),
    statusLabel,
    statusTone,
    done: ['realisee', 'cloturee'].includes(d.statut),
  }
})

/** Repères de la carte de localisation : dépôt et logement (déplaçable). */
export const buildLocationSpec = (S: AppState, sel: Logement, onDrag: (p: LatLng) => void): MapSpec => ({
  maxZoom: 16,
  markers: [
    { pos: DEPOT, html: baseHtml('D'), size: [26, 26], title: 'Dépôt ST' },
    { pos: posLog(S, sel), html: pinHtml('', '#1D4ED8', 32), size: [32, 32], draggable: true, z: 1000, title: `${sel.id} · glisser pour repositionner`, onDrag },
  ],
})

/** Recentrage de la carte sur le logement (la clé change quand la position devient précise). */
export const buildLocationFocus = (S: AppState, sel: Logement): MapFocus => ({ key: sel.id + (approx(sel) ? '~' : '='), c: posLog(S, sel), z: 15 })

/** Logements correspondant aux filtres (et à l'établissement du profil établissement). */
export const filterLogements = (S: AppState, ui: LogUi): Logement[] => {
  const q = ui.q.toLowerCase()
  return S.logements.filter(l =>
    (!q || `${l.id} ${l.adresse} ${l.ville} ${l.crypto}`.toLowerCase().includes(q)) && (!ui.dept || l.dept === ui.dept) && (!ui.typo || l.typo === ui.typo) &&
    (!ui.etab || l.etab === ui.etab) && (S.profil !== 'etab' || l.etab === profilOf(S).etab))
}

/** Fiche du logement sélectionné : synthèse, interventions, constats et arborescence de documents. */
const buildDetail = (S: AppState, sel: Logement, ui: LogUi): HousingDetailModel => {
  const tab: LogTab = ui.tabFor === sel.id ? ui.tab : 'synthese'
  const ds = S.demandes.filter(d => d.logementId === sel.id && d.statut !== 'brouillon').sort((a, b) => b.recueLe.localeCompare(a.recueLe))
  const cs = S.constats.filter(c => c.logementId === sel.id).sort((a, b) => b.date.localeCompare(a.date))
  const docs = docsFor(S, sel)
  const nDocs = docs.demandes.reduce((s, x) => s + x.files.length, 0) + docs.constats.length
  const cnt: Record<string, { n: number; open: boolean }> = {}
  ds.filter(d => diffDays(d.recueLe, TODAY) <= 730).forEach(d => d.lignes.forEach(l => {
    cnt[l.piece] = cnt[l.piece] || { n: 0, open: false }
    cnt[l.piece].n++
    if (!CLOSED.includes(d.statut)) cnt[l.piece].open = true
  }))
  const lastC = cs[0]
  const tabs: [LogTab, string][] = [['synthese', 'Synthèse'], ['inter', `Interventions (${ds.length})`], ['constats', `Constats (${cs.length})`], ['docs', `Documents (${nDocs})`]]
  return {
    id: sel.id,
    typoLabel: `${typoLabel(sel)} · ${sel.surface} m²`,
    actif: sel.actif,
    adresse: `${logAdr(sel)}, ${sel.etage} — ${sel.cp} ${sel.ville}`,
    infoLeft: [['Établissement', sel.etab], ['Code section', sel.section], ['CGL', sel.cgl], ['Dispositif', sel.dispositif], ['Ménage', sel.menage]],
    infoRight: [['ID Crypto', sel.crypto], ['Bailleur', sel.bailleur], ['Demande occupant', sel.dispositif === 'Solibail' ? 'Option activée' : 'Option désactivée'], ['Secteur ST', sel.secteur], ['Accès · clés', `${sel.acces || '—'} · ${sel.cles}`]],
    tabs: tabs.map(([key, label]) => ({ key, label })),
    tab,
    pieces: piecesFor(S, sel).pieces.map(name => ({ name, count: cnt[name] })),
    lastInspection: lastC && {
      photo: lastC.photos[0], date: fdy(lastC.date), contexte: lastC.contexte.toLowerCase(), proprete: lastC.proprete, propreteTone: propCls(lastC.proprete),
      bati: lastC.bati, batiTone: batiCls(lastC.bati), auteur: lastC.auteur, fonction: lastC.fonction.toLowerCase(),
    },
    yearCount: ds.filter(d => diffDays(d.recueLe, TODAY) <= 365).length,
    recent: buildInterventionRows(S, ds.slice(0, 5)),
    interventions: buildInterventionRows(S, ds),
    constats: cs.map(c => ({ c, logement: getLog(S, c.logementId), alert: isAlert(c) })),
    treePath: `Travaux – Logements / ${S.ref.depts[sel.dept] ?? ''} / ${slug(sel.ville)} /`,
    tree: {
      folder: logFolder(sel), open: true, constats: docs.constats,
      demandes: docs.demandes.map(x => ({ folder: x.folder, statut: STAT[x.d.statut][0].toLowerCase(), files: x.files })),
    },
  }
}

/** Données d'affichage de l'écran : liste filtrée et groupée, et fiche du logement sélectionné (`id` de la route, sinon le premier). */
export const buildHousingModel = (S: AppState, ui: LogUi, id?: string): HousingModel => {
  const list = filterLogements(S, ui)
  const sel = getLog(S, id) || list[0]
  const byGroup: Record<string, HousingListGroup> = {}
  list.forEach(l => {
    const key = `${l.dept} › ${l.ville.toUpperCase()}`
    ;(byGroup[key] = byGroup[key] || { key, items: [] }).items.push({
      id: l.id, typo: typoLabel(l), apt: l.apt, adresse: l.adresse, resume: resume(S, l), selected: !!sel && l.id === sel.id,
    })
  })
  return {
    list: {
      actifs: S.logements.filter(l => l.actif).length,
      groups: Object.values(byGroup),
      values: { q: ui.q, dept: ui.dept, typo: ui.typo, etab: ui.etab },
      etabs: uniqueEtabs(S),
      restricted: S.profil === 'etab',
    },
    detail: sel ? buildDetail(S, sel, ui) : undefined,
  }
}
