import type { Meta, StoryObj } from '@storybook/react-vite'
import Field from './Field'

const meta = { title: 'UI/Field', component: Field } satisfies Meta<typeof Field>
export default meta
type Story = StoryObj<typeof meta>

export const WithInput: Story = {
  args: { label: 'Nom', htmlFor: 'nom', children: <input id="nom" className="in" placeholder="Nom de l'ouvrier" /> },
}
export const WithHint: Story = {
  args: { label: 'Téléphone', htmlFor: 'tel', hint: 'Format 06 12 34 56 78', children: <input id="tel" className="in" /> },
}
