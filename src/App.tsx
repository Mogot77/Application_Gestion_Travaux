import { Suspense, lazy, useEffect, type ReactNode } from 'react'
import { AppProvider } from '@/store/providers/AppProvider'
import { AuthProvider } from '@/store/providers/AuthProvider'
import { useAuth } from './hooks/useAuth'
import Login from '@/components/Login'
import ErrorBoundary from '@/components/ErrorBoundary'
import { go, useRoute } from './hooks/useRoute'
import { ROLES, canSee, sectionOf } from '@/helpers/roles'

// Chaque écran est chargé à la demande : le premier chargement ne télécharge que la connexion et le gabarit.
const NewInspection = lazy(() => import('@/components/NewInspection'))
const Users = lazy(() => import('@/components/Users'))
const Requests = lazy(() => import('@/components/Requests'))
const NewRequest = lazy(() => import('@/components/NewRequest'))
const Qualification = lazy(() => import('@/components/Qualification'))
const Planning = lazy(() => import('@/components/Planning'))
const Tours = lazy(() => import('@/components/Tours'))
const Housing = lazy(() => import('@/components/Housing'))
const Inspections = lazy(() => import('@/components/Inspections'))
const Dashboard = lazy(() => import('@/components/Dashboard'))
const Consultation = lazy(() => import('@/components/Consultation'))
const Companies = lazy(() => import('@/components/Companies'))
const Quotes = lazy(() => import('@/components/Quotes'))
const Portal = lazy(() => import('@/components/Portal'))
const JobSheet = lazy(() => import('@/components/JobSheet'))
const Documents = lazy(() => import('@/components/Documents'))
const ReferenceData = lazy(() => import('@/components/ReferenceData'))
const Workers = lazy(() => import('@/components/Workers'))
const MapPage = lazy(() => import('@/components/MapPage'))
const MySchedule = lazy(() => import('@/components/MySchedule'))

type Render = (p: string[], q: Record<string, string>) => ReactNode

const ROUTES: [RegExp, Render][] = [
  [/^\/demandes$/, () => <Requests />],
  [/^\/demande\/new$/, () => <NewRequest />],
  [/^\/demande\/([\w-]+)$/, p => <Qualification id={p[0]} />],
  [/^\/planning$/, () => <Planning />],
  [/^\/tournees$/, () => <Tours />],
  [/^\/logements$/, () => <Housing />],
  [/^\/logement\/([\w-]+)$/, p => <Housing id={p[0]} />],
  [/^\/constats$/, () => <Inspections />],
  [/^\/constat\/new$/, () => <NewInspection />],
  [/^\/tableau$/, () => <Dashboard />],
  [/^\/entreprises$/, () => <Companies />],
  [/^\/consultation\/([\w-]+)$/, p => <Consultation id={p[0]} />],
  [/^\/devis\/([\w-]+)$/, p => <Quotes id={p[0]} />],
  [/^\/portail\/([\w-]+)(?:\/([\w-]+))?$/, p => <Portal csId={p[0]} eid={p[1]} />],
  [/^\/fiche\/([\w,-]+)$/, p => <JobSheet ids={p[0]} />],
  [/^\/classement$/, () => <Documents />],
  [/^\/referentiels$/, () => <ReferenceData />],
  [/^\/ouvriers$/, () => <Workers />],
  [/^\/utilisateurs$/, () => <Users />],
  [/^\/carte$/, () => <MapPage />],
]

function Router() {
  const { path, query } = useRoute()
  const { role } = useAuth()
  useEffect(() => { window.scrollTo(0, 0) }, [path])

  // Garde d'accès : une route hors des droits du rôle renvoie vers sa première section autorisée.
  const section = sectionOf(path)
  let redirect = ''
  if (role) {
    if (section && !canSee(role, section)) redirect = '#/' + ROLES[role].sections[0]
    else if (/^\/demande\/new$/.test(path) && !ROLES[role].creerDemande) redirect = '#/demandes'
  }
  useEffect(() => { if (redirect) go(redirect) }, [redirect])
  if (!role || redirect) return null

  if (role === 'ouvrier') {
    if (/^\/fiche\//.test(path)) return <ErrorBoundary key={path}><JobSheet ids={path.split('/')[2]} /></ErrorBoundary>
    return <ErrorBoundary key="mon-planning"><MySchedule /></ErrorBoundary>
  }
  for (const [re, render] of ROUTES) {
    const m = path.match(re)
    if (m) return <ErrorBoundary key={path}>{render(m.slice(1), query)}</ErrorBoundary>
  }
  return <ErrorBoundary key={path}><Requests /></ErrorBoundary>
}

/** Affiche l'écran demandé, avec un message le temps de son chargement. */
const Screen = ({ children }: { children: ReactNode }) => <Suspense fallback={<p className="p-6 text-sm text-muted">Chargement…</p>}>{children}</Suspense>

/** Tout l'accès est réservé aux comptes Google de la liste blanche ; les données ne se chargent qu'après connexion. */
function Gate() {
  const { user, access } = useAuth()
  if (user === undefined || (user && access === 'loading')) return <p className="p-6 text-sm text-muted">Chargement…</p>
  if (user === null || access !== 'ok') return <Login />
  return (
    <AppProvider>
      <Screen><Router /></Screen>
    </AppProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  )
}
