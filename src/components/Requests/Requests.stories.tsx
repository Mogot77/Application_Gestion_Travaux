import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { INIT } from './constants'
import { buildRequestsModel } from './helpers'
import RequestsView from './RequestsView'
import type { DemUi } from './types'
import { mockState, withProfile } from '@/stories'

const coord = withProfile('coordination')
const etab = withProfile('etablissement')

const meta = {
  title: 'Ecrans/Requests', component: RequestsView,
  args: { model: buildRequestsModel(coord, INIT), ui: INIT, onUi: fn(), onExport: fn(), onPrint: fn(), onToggleSel: fn() },
} satisfies Meta<typeof RequestsView>
export default meta
type Story = StoryObj<typeof meta>

/** Story avec un état de filtres donné : le modèle est recalculé par le vrai constructeur. */
const withUi = (ui: DemUi, S = coord): Story => ({ args: { ui, model: buildRequestsModel(S, ui) } })

export const Default: Story = {}
export const AllRequests: Story = withUi({ ...INIT, tab: 'toutes' })
export const NoResult: Story = withUi({ ...INIT, q: 'introuvable-xyz' })
export const WithSelection: Story = withUi({ ...INIT, tab: 'toutes', sel: mockState.demandes.slice(0, 2).map(d => d.id) })
export const EstablishmentProfile: Story = withUi(INIT, etab)
