import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { mockState } from '@/stories'
import LayoutView from './LayoutView'
import { buildPlayModel, navFor } from './helpers'

const meta = {
  title: 'Ecrans/Layout', component: LayoutView,
  parameters: { layout: 'fullscreen' },
  args: {
    active: 'demandes', nav: navFor('directeur'), canCreate: true, email: 'directeur@equalis.test', theme: 'light', loggedIn: true,
    roleLabel: undefined, play: buildPlayModel(mockState, null),
    onPlayRole: fn(), onPlayEtab: fn(), onPlayOuvrier: fn(), onToggleTheme: fn(), onLogout: fn(),
    children: <p>Contenu de l'écran</p>,
  },
} satisfies Meta<typeof LayoutView>
export default meta
type Story = StoryObj<typeof meta>

export const Directeur: Story = {}
export const DirecteurJouantUnOuvrier: Story = {
  args: { play: buildPlayModel(mockState, { role: 'ouvrier', etab: '', ouvrierId: mockState.ouvriers[0]?.id ?? '' }) },
}
export const Ouvrier: Story = { args: { nav: navFor('ouvrier'), canCreate: false, play: undefined, roleLabel: 'Ouvrier', active: 'planning' } }
export const ThemeSombre: Story = { args: { theme: 'dark' } }
