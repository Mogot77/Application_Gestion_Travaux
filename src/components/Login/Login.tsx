import { useAuth } from '@/hooks/useAuth'
import Button from '@/components/ui/Button'

/** Écran affiché tant que l'utilisateur n'est pas connecté, ou lorsque son compte n'est pas autorisé. */
const Login = () => {
  const { user, access, login, logout, error } = useAuth()
  const blocked = !!user && (access === 'denied' || access === 'error')
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-5 p-6 text-center">
      <h1 className="text-2xl font-bold">Equalis · Travaux</h1>
      {blocked ? (
        <>
          <p role="alert" className="text-sm text-red-600">
            {access === 'denied'
              ? <>Le compte <b>{user.email}</b> n'est pas autorisé. Demandez à un administrateur de l'ajouter.</>
              : "Impossible de vérifier vos droits d'accès. Réessayez plus tard."}
          </p>
          <Button onClick={() => void logout()}>Changer de compte</Button>
        </>
      ) : (
        <>
          <p className="text-sm text-[#6b7280]">Connectez-vous avec votre compte Google pour accéder à l'application.</p>
          <Button variant="primary" onClick={() => void login()}>Se connecter avec Google</Button>
        </>
      )}
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    </main>
  )
}

export default Login
