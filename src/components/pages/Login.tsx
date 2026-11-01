import { useAuth } from '../../hooks/useAuth'

/** Écran affiché tant que l'utilisateur n'est pas connecté avec son compte Google. */
export function Login() {
  const { login, error } = useAuth()
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-5 p-6 text-center">
      <h1 className="text-2xl font-bold">Equalis · Travaux</h1>
      <p className="text-sm text-[#6b7280]">Connectez-vous avec votre compte Google pour accéder à l'application.</p>
      <button type="button" className="btn btnp" onClick={() => void login()}>Se connecter avec Google</button>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    </main>
  )
}
