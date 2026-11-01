import type { Preview } from '@storybook/react-vite'
import '../src/index.css'
import { applyTheme, type Theme } from '../src/helpers/theme'

const preview: Preview = {
  tags: ['autodocs'],
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    options: { storySort: { order: ['Introduction', 'UI', 'Composants', 'Ecrans'] } },
  },
  globalTypes: {
    theme: {
      description: 'Thème de l\'application',
      toolbar: { title: 'Thème', icon: 'circlehollow', dynamicTitle: true, items: [{ value: 'light', title: 'Clair' }, { value: 'dark', title: 'Sombre' }] },
    },
  },
  initialGlobals: { theme: 'light' },
  decorators: [
    (Story, ctx) => {
      applyTheme((ctx.globals.theme ?? 'light') as Theme)
      return <div className="bg-page p-4 text-ink"><Story /></div>
    },
  ],
}

export default preview
