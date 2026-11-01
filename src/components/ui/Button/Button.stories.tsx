import type { Meta, StoryObj } from '@storybook/react-vite'
import Button from './Button'

const meta = { title: 'UI/Button', component: Button, args: { children: 'Enregistrer' } } satisfies Meta<typeof Button>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Primary: Story = { args: { variant: 'primary', children: 'Valider' } }
export const Danger: Story = { args: { variant: 'danger', children: 'Supprimer' } }
export const Small: Story = { args: { size: 'sm', children: 'Modifier' } }
export const Dashed: Story = { args: { dashed: true, children: '+ Ajouter une ligne' } }
export const Disabled: Story = { args: { variant: 'primary', disabled: true } }
