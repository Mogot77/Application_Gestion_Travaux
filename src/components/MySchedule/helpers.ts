import type { AppState, Rdv } from '@/types'
import { canResumeMission } from '@/helpers/mission'
import { RDV_ETAT, equipeIds, getD, getLog, getOuv, logAdr } from '@/helpers/domain'
import { TODAY } from '@/helpers/dates'
import type { MyScheduleModel } from './types'

/** Interventions d'un ouvrier, triées par date puis heure de début. */
export const rdvsOf = (S: AppState, id?: string): Rdv[] =>
  id ? S.rdvs.filter(r => equipeIds(r).includes(id)).sort((a, b) => (a.date + a.debut).localeCompare(b.date + b.debut)) : []

/** Modèle de l'écran : interventions à venir (ou en cours) de l'ouvrier connecté, groupées par jour. */
export const buildScheduleModel = (S: AppState): MyScheduleModel => {
  const id = S.moi?.ouvrierId
  const shown = rdvsOf(S, id).filter(r => r.date >= TODAY || r.etat === 'running' || canResumeMission(S, r))
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
          canResume: canResumeMission(S, r),
          demandeId: d?.id,
          equipe: equipeIds(r).filter(x => x !== id).map(x => getOuv(S, x)?.nom).filter((n): n is string => !!n),
        }
      }),
    })),
  }
}
