import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { mockFacture, mockState } from '@/stories'
import { buildBillingModel } from './helpers'
import BillingView from './BillingView'

const ui = { q: '', statut: '' }
const state = { ...mockState, factures: [mockFacture(), mockFacture({ id: 'FA-2026-0002', statut: 'emise' }), mockFacture({ id: 'FA-2026-0003', statut: 'payee' })] }

const meta = {
  title: 'Ecrans/Billing', component: BillingView,
  args: { ui, model: buildBillingModel(state, ui), onCreate: fn(), onChange: fn() },
} satisfies Meta<typeof BillingView>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** Aucune facture. */
export const Empty: Story = { args: { model: buildBillingModel(mockState, ui) } }
