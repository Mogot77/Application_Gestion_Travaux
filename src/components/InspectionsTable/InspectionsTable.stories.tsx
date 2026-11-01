import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { isAlert } from './helpers'
import InspectionsTableView from './InspectionsTableView'
import { mockConstats, mockLogements } from '@/stories'

const rows = mockConstats.map(c => ({ c, logement: mockLogements.find(l => l.id === c.logementId), alert: isAlert(c) }))

const meta = {
  title: 'Composants/InspectionsTable', component: InspectionsTableView,
  args: { rows, withLog: true, onOpenPhoto: fn(), onNoFollowUp: fn() },
} satisfies Meta<typeof InspectionsTableView>
export default meta
type Story = StoryObj<typeof meta>

export const AllHousings: Story = {}
export const OneHousing: Story = { args: { rows: rows.filter(r => r.c.logementId === rows[0].c.logementId), withLog: false } }
export const Empty: Story = { args: { rows: [] } }
