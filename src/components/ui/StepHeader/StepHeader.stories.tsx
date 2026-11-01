import type { Meta, StoryObj } from '@storybook/react-vite'
import StepHeader from './StepHeader'

const meta = { title: 'UI/StepHeader', component: StepHeader, args: { step: 1, title: 'Auteur et logement concerné' } } satisfies Meta<typeof StepHeader>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const WithExtra: Story = { args: { step: 3, title: 'Problèmes à traiter', children: <span className="muted s13">une ligne par problème</span> } }
