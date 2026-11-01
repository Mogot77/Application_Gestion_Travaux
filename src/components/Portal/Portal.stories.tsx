import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { mockState } from '@/stories'
import { buildPortalModel } from './helpers'
import PortalView from './PortalView'
import type { PortalDraft } from './types'

const csId = 'CS-2026-0011'

const emptyDraft = (postes: number[]): PortalDraft => ({ montantHT: '', tva: '10', delai: '', duree: '', validite: '3', postes, pdf: '', slot: '' })

const waiting = buildPortalModel(mockState, csId, 'e3')
const submitted = buildPortalModel(mockState, csId, 'e1')
const declined = buildPortalModel(mockState, csId, 'e2')

const callbacks = {
  onDraft: fn(), onChooseSlot: fn(), onAsk: fn(), onDeposit: fn(), onDecline: fn(), onUpdateDoc: fn(), onSwitchEnt: fn(), onOpenPhoto: fn(),
}

const meta = {
  title: 'Ecrans/Portal', component: PortalView,
  args: { model: waiting, draft: emptyDraft(waiting?.c.lignes ?? []), ...callbacks },
} satisfies Meta<typeof PortalView>
export default meta
type Story = StoryObj<typeof meta>

/** Entreprise dont le devis est attendu (documents à renouveler). */
export const AwaitingQuote: Story = {}

/** Devis rempli, prêt à être déposé. */
export const DraftFilled: Story = {
  args: { draft: { ...emptyDraft(waiting?.c.lignes ?? []), montantHT: '2400', delai: '10', duree: '5', pdf: 'devis-peinture.pdf' } },
}

/** Devis déjà déposé. */
export const QuoteSubmitted: Story = { args: { model: submitted, draft: emptyDraft(submitted?.c.lignes ?? []) } }

/** Consultation déclinée. */
export const Declined: Story = { args: { model: declined, draft: emptyDraft(declined?.c.lignes ?? []) } }

/** Lien invalide ou expiré. */
export const InvalidLink: Story = { args: { model: null } }
