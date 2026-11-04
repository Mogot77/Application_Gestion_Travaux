import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { mockFacture, mockState } from '@/stories'
import { buildInvoiceModel } from './helpers'
import InvoiceView from './InvoiceView'

const modelOf = (p: Parameters<typeof mockFacture>[0] = {}) => {
  const f = mockFacture(p)
  return buildInvoiceModel({ ...mockState, factures: [f] }, f.id)
}

const meta = {
  title: 'Ecrans/Invoice', component: InvoiceView,
  args: { model: modelOf(), onMeta: fn(), onEmetteur: fn(), onDestinataire: fn(), onLigne: fn(), onAddLigne: fn(), onRemoveLigne: fn(), onEmit: fn(), onPaid: fn(), onCancel: fn(), onPrint: fn() },
} satisfies Meta<typeof InvoiceView>
export default meta
type Story = StoryObj<typeof meta>

/** Brouillon éditable. */
export const Draft: Story = {}

/** Brouillon avec des mentions obligatoires manquantes. */
export const Incomplete: Story = { args: { model: modelOf({ emetteur: { ...mockFacture().emetteur, siret: '', nom: '' } }) } }

/** Facture émise : lecture seule, prête à imprimer. */
export const Issued: Story = { args: { model: modelOf({ statut: 'emise' }) } }

export const Paid: Story = { args: { model: modelOf({ statut: 'payee' }) } }

export const NotFound: Story = { args: { model: null } }
