import type { Meta, StoryObj } from '@storybook/react-vite'
import Chip from './Chip'

const meta = { title: 'UI/Chip', component: Chip, args: { children: 'Réalisée', tone: 'ok' } } satisfies Meta<typeof Chip>
export default meta
type Story = StoryObj<typeof meta>

export const Ok: Story = {}
export const Urgent: Story = { args: { tone: 'u', children: 'Urgent' } }
export const Warning: Story = { args: { tone: 'h48', children: 'Sous 48 h' } }
export const Info: Story = { args: { tone: 'pg', children: 'Planifiée' } }
export const Neutral: Story = { args: { tone: 'gr', children: 'Brouillon' } }

/** Toutes les teintes disponibles. */
export const AllTones: Story = {
  render: () => (
    <div className="row !gap-2">
      {(['u', 'h48', 'pg', 'rx', 'ok', 'gr', 'tl'] as const).map(t => <Chip key={t} tone={t}>{t}</Chip>)}
    </div>
  ),
}
