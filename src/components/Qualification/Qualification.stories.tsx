import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { buildQualificationModel } from './helpers'
import QualificationView from './QualificationView'
import type { QualificationModel } from './types'
import { withProfile } from '@/stories'

const coord = withProfile('coordination')
const etab = withProfile('etablissement')

/** Modèle réel de la fiche, construit avec le même code que l'application. */
const modelOf = (id: string, S = coord): QualificationModel => {
  const model = buildQualificationModel(S, id)
  if (!model) throw new Error(`Demande factice introuvable : ${id}`)
  return model
}

const meta = {
  title: 'Ecrans/Qualification', component: QualificationView,
  args: {
    model: modelOf('DI-2026-0301'),
    onAction: fn(), onSetLine: fn(), onDuree: fn(), onAddPhotos: fn(), onMessage: fn(), onOpenPhoto: fn(),
  },
} satisfies Meta<typeof QualificationView>
export default meta
type Story = StoryObj<typeof meta>

/** Demande à qualifier par la coordination : lignes éditables et boutons de décision. */
export const ToQualify: Story = {}
/** Même demande vue par un établissement : lecture seule. */
export const EstablishmentView: Story = { args: { model: modelOf('DI-2026-0301', etab) } }
/** Demande planifiée avec son créneau au planning. */
export const Planned: Story = { args: { model: modelOf('DI-2026-0290') } }
/** Demande réalisée avec rapport d'intervention à réceptionner. */
export const DoneWithReport: Story = { args: { model: modelOf('DI-2026-0270') } }
/** Sinistre en attente de déclaration. */
export const Claim: Story = { args: { model: modelOf('DI-2026-0277') } }
