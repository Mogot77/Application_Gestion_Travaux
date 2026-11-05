/* Règles métier partagées : accès aux entités, statuts, calculs (fonctions pures sur l'état) */
import type {
  AppState, Demande, DemandeStatut, Entreprise, Ligne, Logement, Ouvrier, ProfilInfo, ProfilKey, Rdv, Tone, UrgenceKey,
} from '../types'
import { TODAY, addDays, diffDays, now, toMin, toTime } from './dates'
import { DAY_END, DAY_START } from './planning'
import { fallbackSuffix, formatId, takeReserved, type SeqKind } from './ids'

/* ---------- Accès ---------- */
export const getD = (S: AppState, id?: string) => S.demandes.find(d => d.id === id)
export const getLog = (S: AppState, id?: string) => S.logements.find(l => l.id === id)
export const getOuv = (S: AppState, id?: string) => S.ouvriers.find(o => o.id === id)
export const getEnt = (S: AppState, id?: string) => S.entreprises.find(e => e.id === id)
export const getCs = (S: AppState, id?: string) => S.consultations.find(c => c.id === id)
export const ouvActifs = (S: AppState): Ouvrier[] => S.ouvriers.filter(o => o.actif !== false)

/** Numéro suivant d'un type. Il vient d'une réservation faite juste avant (`reserveIds`) ; sans réservation (hors ligne), un numéro de secours unique. */
export const nextId = (S: AppState, kind: SeqKind) => {
  const n = takeReserved(kind)
  if (n === undefined) return formatId(kind, TODAY.slice(0, 4), fallbackSuffix())
  S.seq[kind] = Math.max(S.seq[kind], n)
  return formatId(kind, TODAY.slice(0, 4), n)
}
export const hist = (obj: { historique: { at: string; t: string }[] }, t: string) => { obj.historique.unshift({ at: now(), t }) }

export const PROFILS: Record<ProfilKey, ProfilInfo> = {
  etab: { nom: 'S. Martin', label: 'S. Martin · Service Hébergement 77', etab: 'Service Hébergement 77', fonction: 'Travailleur·se social·e' },
  coord: { nom: 'Coordination ST', label: 'Coordination ST', fonction: 'Coordination ST' },
  dir: { nom: 'Direction Immobilier', label: 'Direction Immobilier', fonction: "Directeur·rice d'établissement" },
}
export const profilOf = (S: AppState) => S.moi || PROFILS[S.profil] || PROFILS.coord

/* ---------- Statuts ---------- */
export const STAT: Record<DemandeStatut, [string, Tone]> = {
  brouillon: ['Brouillon', 'gr'], a_qualifier: ['À qualifier', 'gr'], a_valider_occupant: ['À valider (occupant)', 'tl'],
  en_qualification: ['En qualification', 'bl'], a_completer: ['À compléter', 'h48'], a_reactualiser: ['À réactualiser', 'rx'],
  a_planifier: ['À planifier', 'gr'], planifiee: ['Planifiée', 'pg'], en_cours: ['En cours', 'ok'],
  acces_impossible: ['Report nécessaire', 'u'], realisee: ['Réalisée', 'ok'], cloturee: ['Clôturée', 'ok'],
  rejetee: ['Rejetée', 'gr'], bailleur: ['Demandée au bailleur', 'gr'], consultation: ['Consultation en cours', 'bl'],
  prestataire: ['Prestataire mandaté', 'pg'], sinistre: ['Sinistre en cours', 'rx'], annulee: ['Annulée', 'gr'],
}
export const CLOSED: DemandeStatut[] = ['cloturee', 'rejetee', 'annulee']
export const QUALIF: DemandeStatut[] = ['a_qualifier', 'en_qualification', 'a_valider_occupant']
export const URG: Record<UrgenceKey, [string, Tone, string]> = {
  urgent: ['Urgent', 'u', 'URGENT'], h48: ['Sous 48 h', 'h48', '48 H'], prog: ['Programmable', 'pg', 'PROG.'],
}

export const circuitLabel = (S: AppState, k?: string) => (S.ref.circuits.find(c => c.k === k) || { l: '' }).l

export const nextRdv = (S: AppState, d: Demande): Rdv | undefined =>
  S.rdvs.filter(r => r.demandeId === d.id && r.etat !== 'imp').sort((a, b) => (b.date + b.debut).localeCompare(a.date + a.debut))[0]

export const circuitOf = (S: AppState, d: Demande) => {
  const cs = [...new Set(d.lignes.map(l => l.circuit).filter(Boolean))]
  return cs.length ? cs.map(c => circuitLabel(S, c)).join(' + ') : ''
}
export const dureeST = (d: Demande) => d.lignes.filter(l => !l.circuit || l.circuit === 'ST').reduce((s, l) => s + (l.duree || 0), 0) || 60
export const shortLot = (lot?: string) => (lot || '').split(' / ')[0].replace(' (description obligatoire)', '')
export const lineLabel = (l: Pick<Ligne, 'piece' | 'lot' | 'nature'>) => `${l.piece} — ${shortLot(l.lot)} · ${l.nature}`
export const ageOf = (d: Demande) => diffDays(d.recueLe, TODAY)
export const etabOf = (S: AppState, d: Demande) => (getLog(S, d.logementId) || { etab: '' }).etab
export const nbPhotos = (d: Demande) => d.lignes.reduce((s, l) => s + (l.photos || []).length, 0)

/* ---------- Logements et pièces ---------- */
export const piecesFor = (S: AppState, log?: Logement) => {
  const ref = S.ref
  if (!log) return { pieces: ref.piecesLogement, autres: ref.piecesAutres }
  if (log.typo === 'BUR') return { pieces: ref.piecesBureau, autres: ref.piecesAutres }
  const n = parseInt(log.typo.slice(1), 10) || 1
  const pieces = ref.piecesLogement.filter(p => { const m = p.match(/^Chambre (\d)/); return !m || Number(m[1]) <= n - 1 })
  return { pieces, autres: ref.piecesAutres }
}
export const logAdr = (l?: Logement) => l ? `${l.adresse}${l.bat ? ', bât. ' + l.bat : ''}${l.apt ? ', apt ' + l.apt : ''}` : ''
export const typoLabel = (l: Logement) => l.typo === 'BUR' ? 'Bureaux' : l.typo

/* ---------- Entreprises ---------- */
export const entDocs = (e: Entreprise) => {
  const t = TODAY
  const st = {
    kbis: diffDays(e.docs.kbis, t) <= 92, urssaf: diffDays(e.docs.urssaf, t) <= 182,
    rc: e.docs.rc >= t, decennale: e.docs.decennale >= t,
  }
  const ok = Object.values(st).every(Boolean)
  const label = ok ? 'À jour' : !st.urssaf ? 'URSSAF expirée' : !st.kbis ? 'Kbis > 3 mois' : 'Assurance expirée'
  return { ok, st, label }
}

/* ---------- Rendez-vous ---------- */
/** Ouvriers d'une mission : le responsable puis les renforts. */
export const equipeIds = (r: Rdv): string[] => [r.ouvrierId, ...(r.renfortIds ?? [])]
/** Rendez-vous d'un ouvrier un jour donné, en tant que responsable ou en renfort. */
export const rdvsOf = (S: AppState, ouvrierId: string, date: string) =>
  S.rdvs.filter(r => r.date === date && equipeIds(r).includes(ouvrierId)).sort((a, b) => a.debut.localeCompare(b.debut))
export const chargeOf = (S: AppState, ouvrierId: string, date: string) =>
  rdvsOf(S, ouvrierId, date).reduce((s, r) => s + (r.etat === 'imp' ? Math.min(r.duree, 120) : r.duree), 0)
/** Premier créneau libre de la journée (pas de 30 min) ; la mission de `dur` minutes doit finir avant 18 h si possible. */
export const firstFree = (S: AppState, ouvrierId: string, date: string, dur = 0) => {
  let t = toMin(DAY_START)
  rdvsOf(S, ouvrierId, date).forEach(r => { t = Math.max(t, toMin(r.debut) + r.duree) })
  t = Math.ceil(t / 30) * 30
  const last = Math.max(toMin(DAY_START), Math.floor((toMin(DAY_END) - Math.min(dur, toMin(DAY_END) - toMin(DAY_START))) / 30) * 30)
  return toTime(Math.min(t, last))
}
export const RDV_ETAT: Record<Rdv['etat'], [string, Tone]> = {
  done: ['Réalisée', 'ok'], running: ['En cours', 'wa'], planned: ['Prévue', 'pg'], imp: ['Report nécessaire', 'u'],
}

/* ---------- Constats ---------- */
export const propCls = (n: number): Tone => n <= 2 ? 'bad' : n <= 3 ? 'mid' : 'ok'
export const batiCls = (b: string): Tone => b === 'Bon' ? 'ok' : b === 'Moyen' ? 'mid' : 'bad'

/* ---------- Divers ---------- */
export const rapportDate = (d: Demande) => addDays(d.recueLe.slice(0, 10), 80)
export const uniqueEtabs = (S: AppState) => [...new Set(S.logements.map(l => l.etab))]
export const tomorrowOf = (day: string, dow: number) => addDays(day, dow === 5 ? 3 : 1)
