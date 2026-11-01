import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { mockState, withProfile } from '@/stories'
import InspectionsView from './InspectionsView'
import { INIT } from './constants'
import { buildInspectionsModel } from './helpers'

const meta = {
  title: 'Ecrans/Inspections', component: InspectionsView,
  args: { model: buildInspectionsModel(mockState, { ...INIT, per: '' }), onFilter: fn(), onOpenPhoto: fn(), onNoFollowUp: fn() },
} satisfies Meta<typeof InspectionsView>
export default meta
type Story = StoryObj<typeof meta>

export const AllPeriods: Story = {}
export const Last30Days: Story = { args: { model: buildInspectionsModel(mockState, INIT) } }
export const NoResult: Story = { args: { model: buildInspectionsModel(mockState, { ...INIT, per: '', bati: 'Bon', prop: '0' }) } }
export const Establishment: Story = { args: { model: buildInspectionsModel(withProfile('etablissement'), { ...INIT, per: '' }) } }
