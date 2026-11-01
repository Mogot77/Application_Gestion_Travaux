import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { withProfile } from '@/stories'
import { buildQuotesModel } from './helpers'
import QuotesView from './QuotesView'

const coord = withProfile('coordination')

const inProgress = buildQuotesModel(coord, 'CS-2026-0011').model
const ordered = buildQuotesModel(coord, 'CS-2026-0009').model

const callbacks = {
  onRelance: fn(), onExport: fn(), onSetDecision: fn(), onSubmit: fn(), onValidate: fn(), onRefuse: fn(), onQuality: fn(), onAnswer: fn(),
}

const meta = {
  title: 'Ecrans/Quotes', component: QuotesView,
  args: { model: inProgress, ...callbacks },
} satisfies Meta<typeof QuotesView>
export default meta
type Story = StoryObj<typeof meta>

/** Consultation en cours : un devis reçu, un refus, une réponse attendue. */
export const InProgress: Story = {}

/** Commande déjà passée (accord-cadre) : la décision est figée. */
export const Ordered: Story = { args: { model: ordered } }

/** Choix soumis à la direction : seul le profil direction peut valider. */
export const AwaitingDirection: Story = {
  args: {
    model: inProgress && {
      ...inProgress,
      dec: { ...inProgress.dec, entrepriseId: 'e1', motif: 'Meilleure note globale', statut: 'a_valider' },
      locked: true, needDir: true, isDir: false,
    },
  },
}

export const AwaitingDirectionAsDirector: Story = {
  args: {
    model: inProgress && {
      ...inProgress,
      dec: { ...inProgress.dec, entrepriseId: 'e1', motif: 'Meilleure note globale', statut: 'a_valider' },
      locked: true, needDir: true, isDir: true,
    },
  },
}

/** Consultation introuvable. */
export const NotFound: Story = {
  args: { model: buildQuotesModel(coord, 'CS-0000').model, error: buildQuotesModel(coord, 'CS-0000').error },
}
