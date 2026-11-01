import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { mockState, withProfile } from '@/stories'
import WorkersView from './WorkersView'
import { buildWorkersModel } from './helpers'

const meta = {
  title: 'Ecrans/Ouvriers', component: WorkersView,
  args: {
    model: buildWorkersModel(mockState, { q: '', inactifs: false }), q: '', showInactive: false,
    onQuery: fn(), onShowInactive: fn(), onCreate: fn(), onEdit: fn(), onToggle: fn(), onDelete: fn(),
  },
} satisfies Meta<typeof WorkersView>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const NoResult: Story = {
  args: { model: buildWorkersModel(mockState, { q: 'zzz', inactifs: false }), q: 'zzz' },
}

export const WithDeactivated: Story = {
  args: {
    model: buildWorkersModel({ ...mockState, ouvriers: mockState.ouvriers.map((o, i) => i === 0 ? { ...o, actif: false } : o) }, { q: '', inactifs: true }),
    showInactive: true,
  },
}

export const ReadOnlyEstablishment: Story = {
  args: { model: buildWorkersModel(withProfile('etablissement'), { q: '', inactifs: false }) },
}
