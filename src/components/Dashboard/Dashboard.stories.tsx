import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { TODAY } from '@/helpers/dates'
import { mockState, withProfile } from '@/stories'
import { INIT } from './constants'
import { buildDashboardModel } from './helpers'
import DashboardView from './DashboardView'

const S = withProfile('directeur')

const meta = {
  title: 'Ecrans/Dashboard', component: DashboardView,
  args: { ui: INIT, model: buildDashboardModel(S, INIT), onChange: fn(), onExport: fn() },
} satisfies Meta<typeof DashboardView>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** Aucun mois d'activité : mois sans demande. */
export const EmptyMonth: Story = {
  args: { ui: { ...INIT, mois: '2025-01' }, model: buildDashboardModel(mockState, { ...INIT, mois: '2025-01' }) },
}

/** Filtre sur un département précis. */
export const FilteredDepartment: Story = {
  args: { ui: { mois: TODAY.slice(0, 7), dept: '77', etab: '' }, model: buildDashboardModel(S, { mois: TODAY.slice(0, 7), dept: '77', etab: '' }) },
}
