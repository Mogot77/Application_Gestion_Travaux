import type { AppState, Ouvrier } from '@/types'
import { equipeIds, ouvActifs, shortLot } from '@/helpers/domain'
import { TODAY, weekStart } from '@/helpers/dates'
import type { OuvrierStats, WorkersModel, WorkersUi } from './types'

export const stats = (S: AppState, o: Ouvrier): OuvrierStats => {
  const rdvs = S.rdvs.filter(r => equipeIds(r).includes(o.id))
  const ws = weekStart(TODAY)
  const week = rdvs.filter(r => weekStart(r.date) === ws).reduce((s, r) => s + r.duree, 0)
  const avenir = rdvs.filter(r => r.etat === 'planned' && r.date >= TODAY).length
  return { total: rdvs.length, week, avenir }
}

/** Métiers proposés dans le formulaire : ceux des ouvriers et les lots du référentiel. */
export const metiersOf = (S: AppState): string[] =>
  [...new Set([...S.ouvriers.map(x => x.metier), ...Object.keys(S.ref.lots).map(shortLot)])].filter(Boolean)

/** Modèle de l'écran : lignes filtrées avec leurs statistiques, compteurs et droit de modification. */
export const buildWorkersModel = (S: AppState, ui: WorkersUi): WorkersModel => {
  const q = ui.q.toLowerCase()
  const list = S.ouvriers.filter(o => (ui.inactifs || o.actif !== false) && (!q || `${o.nom} ${o.metier} ${o.tel || ''} ${o.email || ''}`.toLowerCase().includes(q)))
  return {
    rows: list.map(o => ({ o, stats: stats(S, o) })),
    total: S.ouvriers.length,
    nActifs: ouvActifs(S).length,
    nInactifs: S.ouvriers.filter(o => o.actif === false).length,
    can: S.profil !== 'etab',
  }
}
