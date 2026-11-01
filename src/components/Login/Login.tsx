import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import LoginView from './LoginView'

/** Écran affiché tant que l'utilisateur n'est pas connecté, ou lorsque son compte n'est pas autorisé. */
const Login = () => {
  const { user, access, login, logout, error } = useAuth()
  const { theme, toggle } = useTheme()
  const blocked = !!user && (access === 'denied' || access === 'error')
  return (
    <LoginView
      theme={theme}
      email={user?.email ?? undefined}
      blocked={blocked ? (access === 'denied' ? 'denied' : 'error') : undefined}
      error={error}
      onLogin={() => void login()}
      onLogout={() => void logout()}
      onToggleTheme={toggle}
    />
  )
}

export default Login
