import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { mockDemandes, mockState, withProfile } from '@/stories'
import MyScheduleView from './MyScheduleView'
import FinishMissionForm from './FinishMissionForm'
import { buildScheduleModel } from './helpers'

const worker = withProfile('ouvrier')

const meta = {
  title: 'Ecrans/MonPlanning', component: MyScheduleView,
  args: { model: buildScheduleModel(worker), onStart: fn(), onFinish: fn(), onResume: fn() },
} satisfies Meta<typeof MyScheduleView>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const NoIntervention: Story = {
  args: { model: buildScheduleModel({ ...worker, rdvs: [] }) },
}

export const NoWorkerLinked: Story = {
  args: { model: buildScheduleModel({ ...mockState, moi: worker.moi ? { ...worker.moi, ouvrierId: undefined } : undefined }) },
}

/** Formulaire affiché dans la modale « Terminer la mission ». */
export const FinishForm: Story = {
  render: () => (
    <div className="grid max-w-xl gap-3">
      <FinishMissionForm
        debut="08:35" lignes={mockDemandes[0].lignes} motifs={mockState.ref.motifsAcces}
        conso={mockDemandes.flatMap(d => d.consommables).slice(0, 2)}
      />
    </div>
  ),
}
