import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { mockState, withProfile } from '@/stories'
import MapPageView from './MapPageView'
import { INIT } from './constants'
import { buildMapPageModel } from './helpers'

const meta = {
  title: 'Ecrans/MapPage', component: MapPageView,
  args: { model: buildMapPageModel(mockState, INIT), onDept: fn(), onEtab: fn(), onMode: fn() },
} satisfies Meta<typeof MapPageView>
export default meta
type Story = StoryObj<typeof meta>

export const AllHousings: Story = {}
export const UrgentOnly: Story = { args: { model: buildMapPageModel(mockState, { ...INIT, mode: 'urgent' }) } }
export const Empty: Story = { args: { model: buildMapPageModel(mockState, { ...INIT, dept: '91', etab: 'Service Hébergement 77' }) } }
export const Establishment: Story = { args: { model: buildMapPageModel(withProfile('etablissement'), INIT) } }
