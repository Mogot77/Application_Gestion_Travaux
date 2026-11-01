import type { Meta, StoryObj } from '@storybook/react-vite'
import Kv from './Kv'

const meta = { title: 'UI/Kv', component: Kv } satisfies Meta<typeof Kv>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { pairs: [['Logement', 'LOG-0452 · Melun'], ['Typologie', 'T3'], ['Secteur', 'ST 77 Sud']] },
}
