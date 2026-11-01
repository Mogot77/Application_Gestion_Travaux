import type { Meta, StoryObj } from '@storybook/react-vite'
import Empty from './Empty'

const meta = { title: 'UI/Empty', component: Empty, args: { children: 'Aucun constat' } } satisfies Meta<typeof Empty>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
