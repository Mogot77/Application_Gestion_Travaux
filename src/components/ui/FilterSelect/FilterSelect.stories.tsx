import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState, type ComponentProps } from 'react'
import FilterSelect from './FilterSelect'

const Demo = (args: ComponentProps<typeof FilterSelect>) => {
  const [value, setValue] = useState(args.value)
  return <FilterSelect {...args} value={value} onChange={setValue} />
}

const meta = { title: 'UI/FilterSelect', component: FilterSelect } satisfies Meta<typeof FilterSelect>
export default meta
type Story = StoryObj<typeof meta>

/** Passe en surbrillance dès qu'une valeur est choisie. */
export const Department: Story = {
  args: { value: '', label: 'Département', options: [{ v: '77', l: '77 · Seine-et-Marne' }, { v: '91', l: '91 · Essonne' }], onChange: () => {} },
  render: args => <Demo {...args} />,
}
