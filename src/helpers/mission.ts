/* Déroulement d'une mission par l'ouvrier : démarrage, fin, reprise, rapport généré automatiquement (logique pure). */
import type { AppState, LigneStatut, Rapport, Rdv } from '../types'
import { getD, hist } from './domain'
import { fday, nowTime } from './dates'

export type FinMission = {
  /** Statut de chaque ligne de travaux ST de la demande, dans l'ordre. */
  lignes: LigneStatut[]
  /** Force le report (ex. accès impossible sans ligne de travaux). */
  report?: boolean
  /** Motif du report (obligatoire si une ligne n'est pas réalisée). */
  motif: string
  obs: string
  conso: { nom: string; qte: number }[]
  /** Photos de ce qui a été fait : intégrées au rapport. */
  photosApres: string[]
  signataire: string
}

export const MOTIFS_REPORT_EXTRA = ['Travaux à poursuivre', 'Matériel ou pièce manquant']

/** Lignes concernées par l'intervention du service technique. */
export const lignesST = <T extends { circuit: string }>(lignes: T[]) => lignes.filter(l => l.circuit === 'ST' || !l.circuit)

/** Secondes comptées par le chronomètre caché de la mission : cumul des reprises précédentes + segment en cours. */
export const chronoSec = (r: Rdv, nowMs: number = Date.now()): number =>
  (r.chronoCumulSec ?? 0) + (r.chronoDepuis !== undefined ? Math.max(0, Math.round((nowMs - r.chronoDepuis) / 1000)) : 0)

/** Temps indiqué dans le rapport : décompte du chronomètre arrondi à la minute supérieure (au moins 1 minute). */
export const chronoMinutes = (r: Rdv, nowMs: number = Date.now()): number => Math.max(1, Math.ceil(chronoSec(r, nowMs) / 60))

/** Une mission reportée peut être reprise tant que la demande attend sa reprogrammation (aucun autre rendez-vous prévu ou en cours). */
export function canResumeMission(s: AppState, r: Rdv): boolean {
  if (r.etat !== 'imp') return false
  const d = getD(s, r.demandeId)
  if (!d || d.statut !== 'acces_impossible') return false
  return !s.rdvs.some(x => x.id !== r.id && x.demandeId === r.demandeId && (x.etat === 'planned' || x.etat === 'running'))
}

/**
 * Démarre (ou reprend) la mission : lance le chronomètre caché et enregistre les photos de l'état initial.
 * Au premier démarrage la mission est « planifiée » ; une mission reportée peut être reprise (le temps déjà compté est conservé).
 */
export function startMission(s: AppState, rdvId: string, photosAvant: string[], nowMs: number = Date.now()): 'start' | 'resume' | null {
  const r = s.rdvs.find(x => x.id === rdvId)
  if (!r) return null
  const resume = r.etat === 'imp'
  if (!resume && r.etat !== 'planned') return null
  if (resume && !canResumeMission(s, r)) return null
  r.etat = 'running'
  r.chronoDepuis = nowMs
  r.chronoCumulSec = r.chronoCumulSec ?? 0
  r.photosAvant = [...(r.photosAvant ?? []), ...photosAvant]
  if (!resume) r.debutReel = `${r.date}T${nowTime()}`
  else { r.finReel = undefined; r.motifImp = undefined }
  const d = getD(s, r.demandeId)
  if (d) {
    d.statut = 'en_cours'
    hist(d, resume ? `Mission reprise (${nowTime()})` : `Mission démarrée (${fday(r.date)} à ${nowTime()})`)
  }
  return resume ? 'resume' : 'start'
}

/**
 * Termine la mission et génère le rapport : rendez-vous « réalisé » si toutes les lignes sont faites,
 * sinon « report nécessaire » (la demande retourne à la planification, la mission peut être reprise).
 * Le temps du rapport est le décompte du chronomètre à cet instant.
 */
export function finishMission(s: AppState, rdvId: string, f: FinMission, nowMs: number = Date.now()): 'done' | 'report' | null {
  const r = s.rdvs.find(x => x.id === rdvId)
  if (!r || r.etat !== 'running') return null
  const d = getD(s, r.demandeId)
  const idx = d ? d.lignes.map((l, i) => (l.circuit === 'ST' || !l.circuit ? i : -1)).filter(i => i >= 0) : []
  const report = f.report || f.lignes.some(l => l !== 'realisee')
  const tempsMin = chronoMinutes(r, nowMs)

  r.chronoCumulSec = chronoSec(r, nowMs)
  r.chronoDepuis = undefined
  r.photosApres = [...(r.photosApres ?? []), ...f.photosApres]

  const rapport: Rapport = {
    tempsMin,
    photosAvant: r.photosAvant ?? [],
    photosApres: r.photosApres,
    lignes: f.lignes,
    motifs: f.lignes.map(l => (l === 'realisee' ? '' : f.motif)),
    conso: f.conso,
    supps: [],
    obs: f.obs,
    signature: '',
    signataire: f.signataire,
    corr: null,
  }
  r.rapport = rapport
  r.finReel = `${r.date}T${nowTime()}`
  r.etat = report ? 'imp' : 'done'
  if (report) r.motifImp = f.motif

  if (d) {
    idx.forEach((li, k) => { d.lignes[li].statut = f.lignes[k] ?? '' })
    if (report) {
      d.statut = 'acces_impossible'
      hist(d, `Report nécessaire : ${f.motif || 'travaux non terminés'} · à reprogrammer ou à reprendre`)
    } else {
      d.statut = 'realisee'
      d.dateIntervention = r.date
      hist(d, `Intervention réalisée (${tempsMin} min) · rapport généré automatiquement`)
    }
  }
  return report ? 'report' : 'done'
}
