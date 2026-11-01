import type { AppState, Rdv } from '@/types'
import { RDV_ETAT, getD, getLog, logAdr } from '@/helpers/domain'
import { TODAY } from '@/helpers/dates'
import type { MyScheduleModel } from './types'

/** Interventions d'un ouvrier, triées par date puis heure de début. */
export const rdvsOf = (S: AppState, id?: string): Rdv[] =>
  id ? S.rdvs.filter(r => r.ouvrierId === id).sort((a, b) => (a.date + a.debut).localeCompare(b.date + b.debut)) : []

/** Modèle de l'écran : interventions à venir (ou en cours) de l'ouvrier connecté, groupées par jour. */
export const buildScheduleModel = (S: AppState): MyScheduleModel => {
  const id = S.moi?.ouvrierId
  const shown = rdvsOf(S, id).filter(r => r.date >= TODAY || r.etat === 'running')
  const days = [...new Set(shown.map(r => r.date))]
  return {
    hasWorker: !!id,
    nom: S.moi?.nom,
    email: S.moi?.email,
    days: days.map(date => ({
      date,
      today: date === TODAY,
      items: shown.filter(r => r.date === date).map(r => {
        const d = getD(S, r.demandeId)
        const lg = getLog(S, d?.logementId)
        return {
          r,
          place: lg ? `${logAdr(lg)}, ${lg.ville}` : undefined,
          etat: RDV_ETAT[r.etat],
          canStart: r.etat === 'planned' && r.date <= TODAY,
          canFinish: r.etat === 'running',
          demandeId: d?.id,
        }
      }),
    })),
  }
}
