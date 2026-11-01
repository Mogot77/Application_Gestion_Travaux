import type { AppState, Demande, Rdv } from '@/types'
import { getD } from '@/helpers/domain'
import { pad, toMin, toTime } from '@/helpers/dates'

export const getRdv = (S: AppState, id?: string) => S.rdvs.find(r => r.id === id)

export const rdvClass = (S: AppState, r: Rdv) => {
  const d = r.demandeId ? getD(S, r.demandeId) : undefined
  const u = d ? (d.lignes[0].urgence || d.urgence) : 'prog'
  return u === 'urgent' ? 'bu' : u === 'h48' ? 'bh' : 'bp'
}

export const fdurS = (min?: number) => { const v = min || 0; const h = Math.floor(v / 60), m = v % 60; return m ? `${h}h${pad(m)}` : `${h}h` }

const URG_ORDER = { urgent: 0, h48: 1, prog: 2 }
export const planQueue = (demandes: Demande[]) => demandes.filter(d => ['a_planifier', 'acces_impossible'].includes(d.statut))
  .sort((a, b) => (URG_ORDER[a.urgence] - URG_ORDER[b.urgence]) || a.recueLe.localeCompare(b.recueLe))

/** Classe CSS de la carte de la file « À planifier ». */
export const cardCls = (d: Demande): string => d.statut === 'acces_impossible' ? 'u' : ({ urgent: 'u', h48: 'h48', prog: 'pg' }[d.urgence])

/** Heures de début proposées (07:30 à 17:00, pas de 30 min). */
export const startSlots = (): string[] => {
  const debs: string[] = []
  for (let t = toMin('07:30'); t <= toMin('17:00'); t += 30) debs.push(toTime(t))
  return debs
}
