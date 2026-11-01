import type { OptItem } from '@/components/ui/Opts'
import type { Scenario, SuiteInfo, SuiteKey } from '@/helpers/constatSuites'
import type { Role } from '@/helpers/roles'

export type ConstatUi = {
  logementId: string
  contexte: string
  proprete: number | null
  bati: string
  signalements: string[]
  photos: string[]
  commentaire: string
  open: boolean
  /** Suites retenues. */
  actions: SuiteKey[]
  /** Échelons à informer par courriel. */
  echelons: Role[]
  /** Choix multiple (true) ou simple (false) des échelons. */
  multi: boolean
}

export type EchelonItem = { role: Role; label: string }

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
  /** Scénarios applicables au constat saisi. */
  scenarios: Scenario[]
  /** Suites et échelons conseillés (union des scénarios). */
  conseil: { suites: SuiteKey[]; echelons: Role[] }
  suites: SuiteInfo[]
  echelons: EchelonItem[]
}

export type NewInspectionViewProps = {
  model: NewInspectionModel
  onPatch: (patch: Partial<ConstatUi>) => void
  onSave: (andCreate: boolean) => void
  onAddFiles: (files: FileList) => void
  onOpenPhoto: (src: string) => void
}

export type FollowupsProps = {
  model: NewInspectionModel
  onPatch: (patch: Partial<ConstatUi>) => void
}
