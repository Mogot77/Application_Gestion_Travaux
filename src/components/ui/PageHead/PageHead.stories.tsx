import type { Meta, StoryObj } from '@storybook/react-vite'
import PageHead from './PageHead'
import Button from '../Button'

const meta = { title: 'UI/PageHead', component: PageHead } satisfies Meta<typeof PageHead>
export default meta
type Story = StoryObj<typeof meta>

export const TitleOnly: Story = { args: { title: 'Ouvriers du service technique' } }
export const WithActions: Story = {
  args: {
    title: "Constats d'état des logements", subtitle: 'Déclarés par tout salarié.',
    children: <Button variant="primary">+ Nouveau constat</Button>,
  },
}
