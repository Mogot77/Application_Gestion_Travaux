import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { uniqueEtabs } from '@/helpers/domain'
import { mockState } from '@/stories'
import UsersView from './UsersView'
import { buildUserRows } from './model'
import type { AppUser } from './types'

const ADMIN = 'admin@equalis.test'
const ME = 'directeur@equalis.test'
const users: AppUser[] = [
  { email: ME, role: 'directeur', addedBy: ADMIN },
  { email: 'coord@equalis.test', role: 'coordinateur', addedBy: ADMIN },
  { email: 'ts@equalis.test', role: 'travailleur_social', etab: 'Service Hébergement 77', addedBy: ME },
  { email: 'karim.b@equalis.test', role: 'ouvrier', addedBy: ME },
]

const meta = {
  title: 'Ecrans/Utilisateurs', component: UsersView,
  parameters: { layout: 'fullscreen' },
  args: {
    status: 'ready', rows: buildUserRows(users, ADMIN, ME), etabs: uniqueEtabs(mockState), busy: false,
    form: { email: '', role: 'travailleur_social', etab: '' },
    onFormChange: fn(), onAdd: fn(), onChangeRole: fn(), onChangeEtab: fn(), onRemove: fn(),
  },
} satisfies Meta<typeof UsersView>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Busy: Story = { args: { busy: true } }
export const Loading: Story = { args: { status: 'loading', rows: [] } }
export const LoadError: Story = { args: { status: 'error', rows: [] } }
export const Forbidden: Story = { args: { status: 'forbidden', rows: [] } }
