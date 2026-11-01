import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { mockState } from '@/stories'
import NewInspectionView from './NewInspectionView'
import { INIT } from './constants'
import { buildNewInspectionModel } from './helpers'

const meta = {
  title: 'Ecrans/NewInspection', component: NewInspectionView,
  args: { model: buildNewInspectionModel(mockState, INIT), onPatch: fn(), onSave: fn(), onAddFiles: fn(), onOpenPhoto: fn() },
} satisfies Meta<typeof NewInspectionView>
export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}

export const Filled: Story = {
  args: {
    model: buildNewInspectionModel(mockState, {
      ...INIT, logementId: 'LOG-0447', contexte: 'Visite à domicile', proprete: 5, bati: 'Moyen',
      signalements: ['Humidité / moisissures'], photos: ['seed', 'seed'], commentaire: 'Moisissures dans la salle de bain',
    }),
  },
}

export const LowCleanliness: Story = {
  args: {
    model: buildNewInspectionModel(mockState, {
      ...INIT, logementId: 'LOG-0322', proprete: 1, bati: 'Dégradé', open: true, signalements: ['Nuisibles', 'Encombrement'],
    }),
  },
}
