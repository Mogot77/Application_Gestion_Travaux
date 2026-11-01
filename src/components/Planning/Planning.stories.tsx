import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { mockDemandes, mockRdvs, mockState } from '@/stories'
import { PLAN_INIT, type PlanUi } from '@/helpers/planning'
import PlanningView from './PlanningView'
import PlanPanelView from './PlanPanelView'
import AppointmentPanelView from './AppointmentPanelView'
import { buildAppointmentModel, buildPlanPanelModel, buildPlanningModel, planQueue } from './helpers'

const callbacks = {
  onPrevWeek: fn(), onNextWeek: fn(), onThisWeek: fn(), onFilter: fn(), onSelectCard: fn(),
  onCell: fn(), onSelectRdv: fn(), onDropCard: fn(), onMap: fn(),
}
const panelCallbacks = {
  onOuvrier: fn(), onDate: fn(), onDebut: fn(), onToggleConso: fn(), onRemoveConso: fn(),
  onAddConso: fn(() => true), onPlan: fn(), onClose: fn(),
}

const hint = <div className="muted s13">Sélectionnez une demande à planifier (ou glissez-la sur un créneau), ou cliquez sur un rendez-vous pour le consulter.</div>

const toPlan = planQueue(mockState.demandes)[0]
const planned = mockRdvs.find(r => r.etat === 'planned' && r.demandeId) ?? mockRdvs[0]
const slot = mockRdvs[1]
const selectionUi: PlanUi = { ...PLAN_INIT, demandeId: toPlan.id, ouvrierId: slot.ouvrierId, date: slot.date, debut: '09:00' }

const meta = {
  title: 'Ecrans/Planning', component: PlanningView,
  args: { ...callbacks, model: buildPlanningModel(mockState, PLAN_INIT), side: hint },
} satisfies Meta<typeof PlanningView>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const UrgentFilter: Story = {
  args: { model: buildPlanningModel(mockState, { ...PLAN_INIT, fUrg: 'urgent' }) },
}

export const NothingToPlan: Story = {
  args: { model: buildPlanningModel({ ...mockState, demandes: mockDemandes.filter(d => !['a_planifier', 'acces_impossible'].includes(d.statut)) }, PLAN_INIT) },
}

export const WithMissionPanel: Story = {
  args: {
    model: buildPlanningModel(mockState, selectionUi),
    side: <PlanPanelView {...panelCallbacks} model={buildPlanPanelModel(mockState, toPlan, selectionUi)} />,
  },
}

export const WithAppointmentPanel: Story = {
  args: {
    model: buildPlanningModel(mockState, { ...PLAN_INIT, rdvSel: planned.id }),
    side: <AppointmentPanelView model={buildAppointmentModel(mockState, planned)} onMove={fn()} onCancel={fn()} />,
  },
}
