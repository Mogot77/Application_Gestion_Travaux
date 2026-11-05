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
  /** Mission reportée, reprenable tant que la demande n'est pas reprogrammée. */
  canResume: boolean
  /** Collègues présents sur la même mission. */
  equipe: string[]
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
  onResume: (rdvId: string) => void
}

export type FinishMissionFormProps = {
  /** Heure de début réelle (ou prévue) affichée en tête du formulaire. */
  debut: string
  lignes: Ligne[]
  motifs: string[]
  conso: Consommable[]
  /** Ouvriers présents sur la mission. */
  equipe: string[]
}

export type PhotoPickerProps = {
  /** Nom des champs cachés qui portent les photos dans le formulaire. */
  name: string
  legend: string
  hint?: string
  required?: boolean
}
