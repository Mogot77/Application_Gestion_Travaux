import type { Constat, Demande, Ligne, Logement, Rapport, Rdv, Tone } from '@/types'
import type { OptItem } from '@/components/ui/Opts'

export type QualificationProps = { id: string }

/** Action métier déclenchée par un bouton de la barre d'actions. */
export type QualifAction =
  | 'completee' | 'reactualisee' | 'renvoyer' | 'rejeter' | 'valider' | 'relancer' | 'cloturer'
  | 'bailleurFait' | 'relancerBailleur' | 'presteFait' | 'declaration' | 'sinistreTravaux'

/** Bouton ou lien de la barre d'actions (un lien a `href`, un bouton a `action`). */
export type QualifBarItem = { key: string; label: string; className: string; href?: string; action?: QualifAction; wrap: boolean }

export type QualifLine = { l: Ligne; circuitText: string; circuitDesc?: string }

export type QualifPlanRow = { r: Rdv; ouvrier?: string; etat: [string, Tone] }

export type QualifReportRow = { r: Rdv; rp: Rapport; ouvrier?: string }

/** Modèle d'affichage de la fiche de qualification d'une demande. */
export type QualificationModel = {
  d: Demande
  log?: Logement
  edit: boolean
  age: number
  urgence: [string, Tone] | null
  status: [string, Tone]
  bar: QualifBarItem[]
  totalST: number
  lines: QualifLine[]
  rapports: QualifReportRow[]
  rdvs: QualifPlanRow[]
  lastC?: Constat
  ouvertes: Demande[]
  n12: number
  imputations: OptItem[]
  circuitOptions: OptItem[]
  urgenceOptions: OptItem[]
}

export type LineField = 'imputation' | 'circuit' | 'urgence'

export type QualificationViewProps = {
  model: QualificationModel
  onAction: (action: QualifAction) => void
  onSetLine: (i: number, k: LineField, v: string) => void
  onDuree: (i: number, delta: number) => void
  onAddPhotos: (i: number, files: FileList) => void
  onMessage: (text: string) => void
  onOpenPhoto: (src: string) => void
}
