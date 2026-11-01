import type { Meta, StoryObj } from '@storybook/react-vite'
import Card from './Card'

const meta = { title: 'UI/Card', component: Card, args: { pad: 'md', children: 'Contenu de la carte' } } satisfies Meta<typeof Card>
export default meta
type Story = StoryObj<typeof meta>

export const Padded: Story = {}
export const Compact: Story = { args: { pad: 'sm' } }
export const Bare: Story = { args: { pad: 'none' } }
