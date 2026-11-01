import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { mockState } from '@/stories'
import JobSheetView from './JobSheetView'
import { buildSheets } from './helpers'

const meta = {
  title: 'Ecrans/JobSheet', component: JobSheetView,
  parameters: { layout: 'fullscreen' },
  args: { sheets: buildSheets(mockState, 'DI-2026-0285'), onPrint: fn() },
} satisfies Meta<typeof JobSheetView>
export default meta
type Story = StoryObj<typeof meta>

export const OneSheet: Story = {}
export const WithReport: Story = { args: { sheets: buildSheets(mockState, 'DI-2026-0270') } }
export const SeveralSheets: Story = { args: { sheets: buildSheets(mockState, 'DI-2026-0285,DI-2026-0290,DI-2026-0292') } }
export const Empty: Story = { args: { sheets: buildSheets(mockState, 'inconnue') } }
