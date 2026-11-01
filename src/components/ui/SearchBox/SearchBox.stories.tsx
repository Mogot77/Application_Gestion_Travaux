import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState, type ComponentProps } from 'react'
import SearchBox from './SearchBox'

const Demo = (args: ComponentProps<typeof SearchBox>) => {
  const [value, setValue] = useState(args.value)
  return <SearchBox {...args} value={value} onChange={setValue} />
}

const meta = { title: 'UI/SearchBox', component: SearchBox } satisfies Meta<typeof SearchBox>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { value: '', placeholder: 'N°, logement, adresse…', onChange: () => {}, className: 'w-full sm:w-[280px]' },
  render: args => <Demo {...args} />,
}
