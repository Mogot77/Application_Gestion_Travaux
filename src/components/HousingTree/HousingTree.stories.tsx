import type { Meta, StoryObj } from '@storybook/react-vite'
import { docsFor } from '@/helpers/docs'
import { STAT } from '@/helpers/domain'
import { mockLogements, mockState } from '@/stories'
import HousingTreeView from './HousingTreeView'
import { logFolder } from './helpers'

const l = mockLogements[0]
const docs = docsFor(mockState, l)

const meta = {
  title: 'Composants/HousingTree', component: HousingTreeView,
  args: {
    folder: logFolder(l), open: true, constats: docs.constats,
    demandes: docs.demandes.map(x => ({ folder: x.folder, statut: STAT[x.d.statut][0].toLowerCase(), files: x.files })),
  },
  decorators: [(Story) => <div className="tree"><Story /></div>],
} satisfies Meta<typeof HousingTreeView>
export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = {}
export const Collapsed: Story = { args: { open: false } }
