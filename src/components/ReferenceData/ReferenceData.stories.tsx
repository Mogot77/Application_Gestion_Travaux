import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { mockState, withProfile } from '@/stories'
import ReferenceDataView from './ReferenceDataView'
import { buildReferenceDataModel } from './helpers'

const meta = {
  title: 'Ecrans/ReferenceData', component: ReferenceDataView,
  parameters: { layout: 'fullscreen' },
  args: {
    model: buildReferenceDataModel(mockState),
    onSetSeuil: fn(), onEditProprete: fn(), onAddValue: fn(() => true), onRenameValue: fn(), onRemoveValue: fn(),
    onAddGroup: fn(() => true), onRenameGroup: fn(), onRemoveGroup: fn(), onEditObj: fn(), onEditRow: fn(), onDeleteRow: fn(),
  },
} satisfies Meta<typeof ReferenceDataView>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
/** Profil établissement : lecture seule. */
export const ReadOnly: Story = { args: { model: buildReferenceDataModel({ ...withProfile('etablissement'), profil: 'etab' }) } }
export const EmptyCities: Story = {
  args: { model: { ...buildReferenceDataModel(mockState), villes: [], depts: [] } },
}
