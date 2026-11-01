import type { Meta, StoryObj } from '@storybook/react-vite'
import Toasts from './Toasts'

const meta = { title: 'UI/Toasts', component: Toasts, parameters: { layout: 'fullscreen' } } satisfies Meta<typeof Toasts>
export default meta
type Story = StoryObj<typeof meta>

export const Messages: Story = {
  args: { items: [{ id: 1, msg: 'Demande DI-2026-0042 envoyée', kind: 'ok' }, { id: 2, msg: 'Synchronisation impossible', kind: 'err' }, { id: 3, msg: 'Brouillon enregistré', kind: '' }] },
}
