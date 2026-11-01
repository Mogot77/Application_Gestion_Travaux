import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import PhotoView from './PhotoView'

const SAMPLE = 'https://picsum.photos/seed/travaux/200/150'

const meta = { title: 'Composants/Photo', component: PhotoView, args: { onOpen: fn(), onDelete: undefined } } satisfies Meta<typeof PhotoView>
export default meta
type Story = StoryObj<typeof meta>

export const WithImage: Story = { args: { src: SAMPLE } }
/** Photo de démonstration (`seed`) : un pictogramme remplace l'image. */
export const Placeholder: Story = { args: { src: 'seed' } }
export const Deletable: Story = { args: { src: SAMPLE, onDelete: fn() } }
export const Small: Story = { args: { src: SAMPLE, w: 36, h: 28 } }
