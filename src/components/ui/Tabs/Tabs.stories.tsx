import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import Tabs from './Tabs'

const Demo = () => {
  const [active, setActive] = useState('toutes')
  return (
    <Tabs
      active={active} onChange={setActive} label="Files"
      tabs={[{ key: 'toutes', label: 'Toutes', badge: 24 }, { key: 'a_traiter', label: 'À traiter', badge: 5 }, { key: 'cloturees', label: 'Clôturées' }]}
    />
  )
}

const meta = { title: 'UI/Tabs', component: Tabs } satisfies Meta<typeof Tabs>
export default meta
type Story = StoryObj<typeof meta>

export const WithBadges: Story = {
  args: { tabs: [], active: '', onChange: () => {} },
  render: () => <Demo />,
}
