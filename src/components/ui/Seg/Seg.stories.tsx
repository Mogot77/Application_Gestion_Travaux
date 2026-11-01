import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import Seg from './Seg'

const Demo = () => {
  const [sel, setSel] = useState<string>('Oui')
  return <Seg values={['Oui', 'Non']} sel={sel} onPick={setSel} label="Réponse" />
}

const meta = { title: 'UI/Seg', component: Seg } satisfies Meta<typeof Seg>
export default meta
type Story = StoryObj<typeof meta>

export const Choice: Story = {
  args: { values: ['Oui', 'Non'], sel: 'Oui', onPick: () => {} },
  render: () => <Demo />,
}
