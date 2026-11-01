import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { mockState } from '@/stories'
import { buildCompaniesModel } from './helpers'
import CompaniesView from './CompaniesView'

const ui = { q: '', f: '' }

const meta = {
  title: 'Ecrans/Companies', component: CompaniesView,
  args: { ui, model: buildCompaniesModel(mockState, ui), onChange: fn() },
} satisfies Meta<typeof CompaniesView>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** Filtre « Devis attendu ». */
export const PendingQuotes: Story = {
  args: { ui: { q: '', f: 'attente' }, model: buildCompaniesModel(mockState, { q: '', f: 'attente' }) },
}

/** Aucune entreprise ne correspond à la recherche. */
export const NoMatch: Story = {
  args: { ui: { q: 'zzz', f: '' }, model: buildCompaniesModel(mockState, { q: 'zzz', f: '' }) },
}
