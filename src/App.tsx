import { useEffect, type ReactNode } from 'react'
import { AppProvider } from './store/AppProvider'
import { AuthProvider } from './store/AuthProvider'
import { useAuth } from './hooks/useAuth'
import Login from '@/components/Login'
import NewInspection from '@/components/NewInspection'
import Users from '@/components/Users'
import ErrorBoundary from '@/components/ErrorBoundary'
import { go, useRoute } from './hooks/useRoute'
import Requests from '@/components/Requests'
import NewRequest from '@/components/NewRequest'
import Qualification from '@/components/Qualification'
import Planning from '@/components/Planning'
import Tours from '@/components/Tours'
import Housing from '@/components/Housing'
import Inspections from '@/components/Inspections'
import Dashboard from '@/components/Dashboard'
import Consultation from '@/components/Consultation'
import Companies from '@/components/Companies'
import Quotes from '@/components/Quotes'
import Portal from '@/components/Portal'
import JobSheet from '@/components/JobSheet'
import Documents from '@/components/Documents'
import ReferenceData from '@/components/ReferenceData'
import Workers from '@/components/Workers'
import MapPage from '@/components/MapPage'
import MySchedule from '@/components/MySchedule'
import { ROLES, canSee, sectionOf } from '@/helpers/roles'

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

/** Tout l'accès est réservé aux comptes Google de la liste blanche ; les données ne se chargent qu'après connexion. */
function Gate() {
  const { user, access } = useAuth()
  if (user === undefined || (user && access === 'loading')) return <p className="p-6 text-sm text-[#6b7280]">Chargement…</p>
  if (user === null || access !== 'ok') return <Login />
  return (
    <AppProvider>
      <Router />
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
