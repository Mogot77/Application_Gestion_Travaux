import { useEffect, useState } from 'react'
import type { AppState, Demande, Ouvrier, Rdv, Work } from '../types'
import { TODAY, diffDays, ftime, nowTime, toMin } from './dates'
import { ouvActifs, getOuv } from './domain'

export const NOBODY: Ouvrier = { id: '', nom: 'Aucun ouvrier', metier: '', color: '#9AA3B0' }

/** Ouvrier « connecté » sur l'application mobile (démonstration). */
export const meOf = (S: AppState): Ouvrier => getOuv(S, S.mobile.ouvrierId) || ouvActifs(S)[0] || NOBODY

/** Minutes écoulées depuis le démarrage réel d'une mission. */
export const elapsed = (r: { debutReel?: string }) => {
  if (!r.debutReel) return 0
  let m = toMin(nowTime()) - toMin(ftime(r.debutReel))
  if (r.debutReel.slice(0, 10) !== TODAY) m += 1440 * diffDays(r.debutReel, TODAY)
  return Math.max(0, m)
}

/** Lignes de la demande réalisées par le service technique (avec leur indice d'origine). */
export const stLines = (d: Demande) => d.lignes.map((l, i) => ({ l, i })).filter(x => x.l.circuit === 'ST' || !x.l.circuit)

/** Crée le brouillon de saisie de fin de mission s'il n'existe pas encore. */
export const ensureWork = (r: Rdv, d: Demande): Work => {
  if (!r.work) {
    r.work = { lignes: {}, motifs: {}, apres: {}, conso: d.consommables.filter(c => c.pris || c.origine === 'Stock').map(c => ({ nom: c.nom, qte: c.qte })), supps: [], obs: '', signature: '', signataire: '', corr: null }
  }
  return r.work
}

/** Force un nouveau rendu à intervalle régulier (chronomètres). */
export function useTick(ms: number) {
  const [, setN] = useState(0)
  useEffect(() => {
    const t = window.setInterval(() => setN(n => n + 1), ms)
    return () => window.clearInterval(t)
  }, [ms])
}
