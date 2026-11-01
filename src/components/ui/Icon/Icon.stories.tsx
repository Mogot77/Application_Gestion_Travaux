import type { Meta, StoryObj } from '@storybook/react-vite'
import Icon from './Icon'

const meta = { title: 'UI/Icon', component: Icon, args: { name: 'search' } } satisfies Meta<typeof Icon>
export default meta
type Story = StoryObj<typeof meta>

export const Search: Story = {}
export const AllIcons: Story = {
  render: () => (
    <div className="row !gap-4">
      {(['chev', 'search', 'cam', 'photo', 'info', 'upload', 'sun', 'moon'] as const).map(n => <span key={n} className="row !gap-1 s13"><Icon name={n} />{n}</span>)}
    </div>
  ),
}
