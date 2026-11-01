import type { ReactNode } from 'react'
import type { Consommable, Demande, Ligne, Logement, Ouvrier, Rdv, Tone } from '@/types'
import type { PlanUi } from '@/helpers/planning'

export type SetUi = (p: Partial<PlanUi>) => void

export type LoadBarProps = { min: number; max?: number }

export type CardTagProps = { d: Demande }

/* ───────── Panneau « fiche mission » ───────── */

export type PlanPanelProps = { d: Demande; ui: PlanUi; setUi: SetUi }

export type PlanPanelModel = {
  d: Demande
  log?: Logement
  /** Adresse du logement. */
  adr: string
  /** Lignes de travaux du service technique. */
  lignes: Ligne[]
  /** Durée estimée, en minutes. */
  dur: number
  ouvOptions: { v: string; l: string }[]
  ouvrierId: string
  date: string
  debut: string
  /** Heures de début proposées. */
  slots: string[]
  /** Heure de fin du créneau choisi (vide tant que le début n'est pas choisi). */
  fin: string
  /** Avertissement (chevauchement, journée trop chargée, date passée). */
  warn: string
  consommables: Consommable[]
  canPlan: boolean
}

export type PlanPanelViewProps = {
  model: PlanPanelModel
  onOuvrier: (id: string) => void
  onDate: (date: string) => void
  onDebut: (debut: string) => void
  onToggleConso: (index: number, pris: boolean) => void
  onRemoveConso: (index: number) => void
  /** Ajoute un consommable ; renvoie faux si la saisie est refusée (le brouillon est alors conservé). */
  onAddConso: (nom: string, qte: string, origine: string) => boolean
  onPlan: () => void
  onClose: () => void
}

/* ───────── Panneau « rendez-vous » ───────── */

export type AppointmentPanelProps = { r: Rdv; setUi: SetUi }

export type AppointmentModel = {
  r: Rdv
  ouvrierNom?: string
  demandeId?: string
  /** Logement (« id · ville ») ou tiret. */
  logement: string
  travaux: string
  etat: [string, Tone]
}

export type AppointmentPanelViewProps = {
  model: AppointmentModel
  onMove: () => void
  onCancel: () => void
}

/* ───────── Écran ───────── */

export type QueueItem = {
  d: Demande
  /** Classe CSS de la carte selon l'urgence. */
  cls: string
  selected: boolean
  ville?: string
  dept?: string
  typo?: string
  logId?: string
  summary: string
  info: string
}

export type PlanBlock = { r: Rdv; icon: string; cls: string; selected: boolean }

export type PlanCell = {
  date: string
  today: boolean
  blocks: PlanBlock[]
  /** Créneau en cours de planification, affiché en pointillé. */
  ghost?: { label: string; dur: string }
  /** Charge de la journée en minutes (ghost compris). */
  load: number
}

export type PlanRow = { o: Ouvrier; week: number; cells: PlanCell[] }

export type PlanningModel = {
  /** Lundi de la semaine affichée. */
  week: string
  days: string[]
  isCurrentWeek: boolean
  /** Demandes à planifier (avant filtre d'urgence). */
  queueCount: number
  fUrg: PlanUi['fUrg']
  queue: QueueItem[]
  rows: PlanRow[]
  /** Interventions hors planning du service technique. */
  hors: number
  /** Demandes ayant un rendez-vous aujourd'hui (impression des fiches). */
  todayIds: string[]
}

export type PlanningViewProps = {
  model: PlanningModel
  /** Panneau latéral déjà composé par le conteneur (fiche mission, rendez-vous ou invite). */
  side: ReactNode
  onPrevWeek: () => void
  onNextWeek: () => void
  onThisWeek: () => void
  onFilter: (k: PlanUi['fUrg']) => void
  onSelectCard: (demandeId: string) => void
  onCell: (ouvrierId: string, date: string) => void
  onSelectRdv: (rdvId: string) => void
  onDropCard: (demandeId: string, ouvrierId: string, date: string) => void
  onMap: () => void
}
