import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { mockState, withProfile } from '@/stories'
import DocumentsView from './DocumentsView'
import { buildDocumentsModel } from './helpers'

const meta = {
  title: 'Ecrans/Documents', component: DocumentsView,
  args: { model: buildDocumentsModel(mockState, { v: '' }), onView: fn() },
} satisfies Meta<typeof DocumentsView>
export default meta
type Story = StoryObj<typeof meta>

export const AllFiles: Story = {}
export const ReportsOnly: Story = { args: { model: buildDocumentsModel(mockState, { v: 'rap' }) } }
export const NoMatch: Story = { args: { model: buildDocumentsModel(mockState, { v: 'week' }) } }
export const Establishment: Story = { args: { model: buildDocumentsModel(withProfile('etablissement'), { v: '' }) } }
