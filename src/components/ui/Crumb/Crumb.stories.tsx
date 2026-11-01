import type { Meta, StoryObj } from '@storybook/react-vite'
import Crumb from './Crumb'

const meta = { title: 'UI/Crumb', component: Crumb } satisfies Meta<typeof Crumb>
export default meta
type Story = StoryObj<typeof meta>

export const Trail: Story = {
  args: { items: [{ label: 'Demandes', href: '#/demandes' }, { label: 'DI-2026-0042', href: '#/demande/DI-2026-0042' }, { label: 'Consultation' }] },
}
