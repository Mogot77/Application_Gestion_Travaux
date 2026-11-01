import type { OptItem } from '@/components/ui/Opts'

export type ConstatUi = {
  logementId: string
  contexte: string
  proprete: number | null
  bati: string
  signalements: string[]
  photos: string[]
  commentaire: string
  open: boolean
}

export type NewInspectionModel = {
  /** Brouillon en cours de saisie. */
  draft: ConstatUi
  logements: OptItem[]
  contextes: string[]
  /** Contexte effectivement affiché (le premier du référentiel par défaut). */
  contexte: string
  /** Libellé de la note de propreté choisie (« 3 · sale »), « — » tant qu'aucune note n'est choisie. */
  propreteLabel: string
  /** Signalements du référentiel, par groupe. */
  groupes: [string, string[]][]
}

export type NewInspectionViewProps = {
  model: NewInspectionModel
  onPatch: (patch: Partial<ConstatUi>) => void
  onSave: (andCreate: boolean) => void
  onAddFiles: (files: FileList) => void
  onOpenPhoto: (src: string) => void
}
