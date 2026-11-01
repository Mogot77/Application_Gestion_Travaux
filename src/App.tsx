import { useEffect, type ReactNode } from 'react'
import { AppProvider } from './store/AppProvider'
import { AuthProvider } from './store/AuthProvider'
import { useAuth } from './hooks/useAuth'
import { Login } from './components/pages/Login'
import { NouveauConstat } from './components/pages/NouveauConstat'
import { Utilisateurs } from './components/pages/Utilisateurs'
import { ErrorBoundary } from './components/ErrorBoundary'
import { go, useRoute } from './hooks/useRoute'
import { Demandes } from './components/pages/Demandes'
import { NouvelleDemande } from './components/pages/NouvelleDemande'
import { Qualif } from './components/pages/Qualif'
import { Planning } from './components/pages/Planning'
import { Tournees } from './components/pages/Tournees'
import { Logements } from './components/pages/Logements'
import { Constats } from './components/pages/Constats'
import { Tableau } from './components/pages/Tableau'
import { Consultation } from './components/pages/Consultation'
import { Entreprises } from './components/pages/Entreprises'
import { Devis } from './components/pages/Devis'
import { Portail } from './components/pages/Portail'
import { Fiche } from './components/pages/Fiche'
import { Classement } from './components/pages/Classement'
import { Referentiels } from './components/pages/Referentiels'
import { Ouvriers } from './components/pages/Ouvriers'
import { Carte } from './components/pages/Carte'
import { MonPlanning } from './components/pages/MonPlanning'
import { ROLES, canSee, sectionOf } from './lib/roles'

type Render = (p: string[], q: Record<string, string>) => ReactNode

const ROUTES: [RegExp, Render][] = [
  [/^\/demandes$/, () => <Demandes />],
  [/^\/demande\/new$/, () => <NouvelleDemande />],
  [/^\/demande\/([\w-]+)$/, p => <Qualif id={p[0]} />],
  [/^\/planning$/, () => <Planning />],
  [/^\/tournees$/, () => <Tournees />],
  [/^\/logements$/, () => <Logements />],
  [/^\/logement\/([\w-]+)$/, p => <Logements id={p[0]} />],
  [/^\/constats$/, () => <Constats />],
  [/^\/constat\/new$/, () => <NouveauConstat />],
  [/^\/tableau$/, () => <Tableau />],
  [/^\/entreprises$/, () => <Entreprises />],
  [/^\/consultation\/([\w-]+)$/, p => <Consultation id={p[0]} />],
  [/^\/devis\/([\w-]+)$/, p => <Devis id={p[0]} />],
  [/^\/portail\/([\w-]+)(?:\/([\w-]+))?$/, p => <Portail csId={p[0]} eid={p[1]} />],
  [/^\/fiche\/([\w,-]+)$/, p => <Fiche ids={p[0]} />],
  [/^\/classement$/, () => <Classement />],
  [/^\/referentiels$/, () => <Referentiels />],
  [/^\/ouvriers$/, () => <Ouvriers />],
  [/^\/utilisateurs$/, () => <Utilisateurs />],
  [/^\/carte$/, () => <Carte />],
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
    if (/^\/fiche\//.test(path)) return <ErrorBoundary key={path}><Fiche ids={path.split('/')[2]} /></ErrorBoundary>
    return <ErrorBoundary key="mon-planning"><MonPlanning /></ErrorBoundary>
  }
  for (const [re, render] of ROUTES) {
    const m = path.match(re)
    if (m) return <ErrorBoundary key={path}>{render(m.slice(1), query)}</ErrorBoundary>
  }
  return <ErrorBoundary key={path}><Demandes /></ErrorBoundary>
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
