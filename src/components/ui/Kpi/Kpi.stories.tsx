import type { Meta, StoryObj } from '@storybook/react-vite'
import Kpi from './Kpi'

const meta = { title: 'UI/Kpi', component: Kpi, args: { label: 'Demandes reçues', value: 42, sub: 'dont 3 urgentes' } } satisfies Meta<typeof Kpi>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Alert: Story = { args: { label: 'Demandes hors procédure', value: 5, valueClassName: 'text-warn', sub: 'mail ou téléphone' } }
export const Row: Story = {
  render: () => (
    <div className="kpis">
      <Kpi label="Demandes reçues" value={42} sub="dont 3 urgentes" />
      <Kpi label="Délai moyen" value="6 j" sub="urgentes : 1 j" />
      <Kpi label="Rapports sous 48 h" value="92 %" sub="objectif 95 %" />
    </div>
  ),
}
