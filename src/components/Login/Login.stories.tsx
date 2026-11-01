import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import LoginView from './LoginView'

const meta = {
  title: 'Ecrans/Login', component: LoginView,
  parameters: { layout: 'fullscreen' },
  args: { theme: 'light', onLogin: fn(), onLogout: fn(), onToggleTheme: fn() },
} satisfies Meta<typeof LoginView>
export default meta
type Story = StoryObj<typeof meta>

export const SignedOut: Story = {}
export const AccountDenied: Story = { args: { email: 'inconnu@gmail.com', blocked: 'denied' } }
export const CheckFailed: Story = { args: { email: 'inconnu@gmail.com', blocked: 'error' } }
export const WithError: Story = { args: { error: 'La connexion a échoué. Réessayez.' } }
export const Dark: Story = { args: { theme: 'dark' } }
