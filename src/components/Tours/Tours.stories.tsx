import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { mockState } from '@/stories'
import { ouvActifs } from '@/helpers/domain'
import ToursView from './ToursView'
import { buildToursModel, mapSpec } from './helpers'

/** Modèle et contenu de carte construits avec les vrais builders, à partir de l'état factice. */
const build = (S: typeof mockState, ouv: string, hide: string[]) => {
  const ouvs = ouvActifs(S)
  const model = buildToursModel(S, ouvs, ouv)
  return { model, hide, spec: mapSpec(S, ouvs, hide, model.ouvId, fn()) }
}

const meta = {
  title: 'Ecrans/Tournees', component: ToursView,
  args: { ...build(mockState, 'o1', []), onToggle: fn(), onSelectTeam: fn(), onAssign: fn(), onCalendar: fn() },
} satisfies Meta<typeof ToursView>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const OtherWorkerAndHiddenTeam: Story = { args: build(mockState, 'o2', ['o3']) }

export const NoActiveWorker: Story = {
  args: build({ ...mockState, ouvriers: mockState.ouvriers.map(o => ({ ...o, actif: false })) }, '', []),
}

export const NoUrgency: Story = {
  args: build({ ...mockState, demandes: mockState.demandes.filter(d => d.urgence !== 'urgent') }, 'o1', []),
}
