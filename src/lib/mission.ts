/* Déroulement d'une mission par l'ouvrier : démarrage, fin, rapport généré automatiquement (logique pure). */
import type { AppState, LigneStatut, Rapport } from '../types'
import { getD, hist } from './domain'
import { fday, nowTime, toMin } from './dates'

export interface FinMission {
  /** Statut de chaque ligne de travaux ST de la demande, dans l'ordre. */
  lignes: LigneStatut[]
  /** Force le report (ex. accès impossible sans ligne de travaux). */
  report?: boolean
  /** Motif du report (obligatoire si une ligne n'est pas réalisée). */
  motif: string
  obs: string
  conso: { nom: string; qte: number }[]
  tempsMin: number
  signataire: string
}

export const MOTIFS_REPORT_EXTRA = ['Travaux à poursuivre', 'Matériel ou pièce manquant']

/** Lignes concernées par l'intervention du service technique. */
export const lignesST = <T extends { circuit: string }>(lignes: T[]) => lignes.filter(l => l.circuit === 'ST' || !l.circuit)

/** Minutes écoulées depuis l'heure de début réelle (au moins 1). */
export const tempsEcoule = (debutReel?: string) => Math.max(1, toMin(nowTime()) - toMin(debutReel ?? nowTime()))

/** Planned → en cours : enregistre l'heure de début réelle. */
export function startMission(s: AppState, rdvId: string): boolean {
  const r = s.rdvs.find(x => x.id === rdvId)
  if (!r || r.etat !== 'planned') return false
  r.etat = 'running'
  r.debutReel = `${r.date}T${nowTime()}`
  const d = getD(s, r.demandeId)
  if (d) { d.statut = 'en_cours'; hist(d, `Mission démarrée (${fday(r.date)} à ${nowTime()})`) }
  return true
}

/**
 * Termine la mission et génère le rapport : rendez-vous « réalisé » si toutes les lignes sont faites,
 * sinon « report nécessaire » (la demande retourne à la planification).
 */
export function finishMission(s: AppState, rdvId: string, f: FinMission): 'done' | 'report' | null {
  const r = s.rdvs.find(x => x.id === rdvId)
  if (!r || r.etat !== 'running') return null
  const d = getD(s, r.demandeId)
  const idx = d ? d.lignes.map((l, i) => (l.circuit === 'ST' || !l.circuit ? i : -1)).filter(i => i >= 0) : []
  const report = f.report || f.lignes.some(l => l !== 'realisee')

  const rapport: Rapport = {
    tempsMin: f.tempsMin,
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
      hist(d, `Report nécessaire : ${f.motif || 'travaux non terminés'} · à reprogrammer`)
    } else {
      d.statut = 'realisee'
      d.dateIntervention = r.date
      hist(d, `Intervention réalisée (${f.tempsMin} min) · rapport généré automatiquement`)
    }
  }
  return report ? 'report' : 'done'
}
