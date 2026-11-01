import type { Meta, StoryObj } from '@storybook/react-vite'
import AddPhoto from './AddPhoto'

const meta = { title: 'UI/AddPhoto', component: AddPhoto, args: { onFiles: () => {} } } satisfies Meta<typeof AddPhoto>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Required: Story = { args: { label: 'Prendre ou ajouter une photo (obligatoire)', w: 320, req: true } }
