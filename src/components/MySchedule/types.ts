import type { Consommable, Ligne, Rdv, Tone } from '@/types'

/** Une intervention de la liste, avec ce qui est déjà calculé pour l'affichage. */
export type ScheduleItem = {
  r: Rdv
  /** Adresse et ville du logement, si connu. */
  place?: string
  /** Libellé et ton de l'état du rendez-vous. */
  etat: [string, Tone]
  canStart: boolean
  canFinish: boolean
  /** Identifiant de la demande liée (fiche / rapport). */
  demandeId?: string
}

export type ScheduleDay = { date: string; today: boolean; items: ScheduleItem[] }

export type MyScheduleModel = {
  /** Faux si le compte n'est associé à aucun ouvrier. */
  hasWorker: boolean
  nom?: string
  email?: string
  days: ScheduleDay[]
}

export type MyScheduleViewProps = {
  model: MyScheduleModel
  onStart: (rdvId: string) => void
  onFinish: (rdvId: string) => void
}

export type FinishMissionFormProps = {
  /** Heure de début réelle (ou prévue) affichée en tête du formulaire. */
  debut: string
  lignes: Ligne[]
  motifs: string[]
  conso: Consommable[]
  /** Temps passé proposé par défaut, en minutes. */
  tempsDefault: number
}
