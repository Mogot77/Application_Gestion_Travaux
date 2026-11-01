import type { Meta, StoryObj } from '@storybook/react-vite'
import Note from './Note'

const meta = { title: 'UI/Note', component: Note, args: { children: 'Lecture seule pour les établissements.' } } satisfies Meta<typeof Note>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Warning: Story = { args: { tone: 'warn', children: 'Demande de plus de 2 mois sans intervention.' } }
export const Info: Story = { args: { tone: 'info', children: 'La coordination a été informée.' } }
