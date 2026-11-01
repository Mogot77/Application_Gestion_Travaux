import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { mockLogements, mockState, withProfile } from '@/stories'
import type { AppState } from '@/types'
import HousingView from './HousingView'
import LocationCardView from './LocationCardView'
import { INIT } from './constants'
import { buildHousingModel, buildLocationFocus, buildLocationSpec } from './helpers'

/** Carte de localisation du logement affiché (callbacks factices). */
const locationOf = (S: AppState, id: string) => {
  const sel = mockLogements.find(l => l.id === id) ?? mockLogements[0]
  return (
    <LocationCardView
      id={sel.id} ville={sel.ville} approx={sel.lat == null || sel.lng == null} busy={false}
      spec={buildLocationSpec(S, sel, fn())} focus={buildLocationFocus(S, sel)} onGeolocate={fn()} onReset={fn()}
    />
  )
}

const meta = {
  title: 'Ecrans/Housing', component: HousingView,
  args: {
    model: buildHousingModel(mockState, INIT, 'LOG-0452'), location: locationOf(mockState, 'LOG-0452'),
    onSearch: fn(), onDept: fn(), onTypo: fn(), onEtab: fn(), onNew: fn(), onTab: fn(), onOpenPhoto: fn(), onNoFollowUp: fn(),
  },
} satisfies Meta<typeof HousingView>
export default meta
type Story = StoryObj<typeof meta>

export const Summary: Story = {}
export const Interventions: Story = { args: { model: buildHousingModel(mockState, { ...INIT, tab: 'inter', tabFor: 'LOG-0452' }, 'LOG-0452') } }
export const Inspections: Story = { args: { model: buildHousingModel(mockState, { ...INIT, tab: 'constats', tabFor: 'LOG-0447' }, 'LOG-0447'), location: locationOf(mockState, 'LOG-0447') } }
export const Documents: Story = { args: { model: buildHousingModel(mockState, { ...INIT, tab: 'docs', tabFor: 'LOG-0452' }, 'LOG-0452') } }
export const NoResult: Story = { args: { model: buildHousingModel(mockState, { ...INIT, q: 'introuvable' }) } }
export const Establishment: Story = { args: { model: buildHousingModel(withProfile('etablissement'), INIT, 'LOG-0452') } }
