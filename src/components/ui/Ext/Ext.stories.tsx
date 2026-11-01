import type { Meta, StoryObj } from '@storybook/react-vite'
import Ext from './Ext'

const meta = { title: 'UI/Ext', component: Ext, args: { name: 'DI-2026-0042_00_Demande.pdf' } } satisfies Meta<typeof Ext>
export default meta
type Story = StoryObj<typeof meta>

export const Pdf: Story = {}
export const Photo: Story = { args: { name: 'DI-2026-0042_L1_Cuisine_AVANT_01.jpg' } }
