import type { Demande, Ligne, Logement, Ouvrier, Rapport, Rdv, SuppRapport } from '@/types'

export type JobSheetProps = { ids: string }

export type FakeQrProps = { seed: string }

export type BoxProps = { on?: boolean }

/** Données déjà calculées d'une fiche d'intervention (recto + verso). */
export type SheetModel = {
  d: Demande
  log?: Logement
  /** Dernier rendez-vous réalisé ou rapporté. */
  r?: Rdv
  /** Rendez-vous « accès impossible » éventuel. */
  imp?: Rdv
  o?: Ouvrier
  rp?: Rapport
  /** Lignes à exécuter par le service technique. */
  lignes: Ligne[]
  photos: { src: string; n: number; piece: string }[]
  urgLabel: string
  supps: SuppRapport[]
  /** Premiers motifs d'accès impossible proposés sur le verso. */
  motifsAcces: string[]
}

export type PagesProps = { m: SheetModel }

export type JobSheetViewProps = {
  sheets: SheetModel[]
  onPrint: () => void
}
