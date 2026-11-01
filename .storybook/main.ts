import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: '@storybook/react-vite',
  // Le Storybook est publié dans un sous-dossier (/storybook) du site : les chemins doivent rester relatifs.
  viteFinal: config => ({ ...config, base: './' }),
}

export default config
