import { useEffect, type ReactNode } from 'react'
import { AppProvider } from './store/AppProvider'
import { ErrorBoundary } from './components/ErrorBoundary'
import { useRoute } from './hooks/useRoute'
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
import { MesMissions, MissionDetail } from './components/mobile/Missions'
import { Terminer } from './components/mobile/Terminer'
import { ConstatMobile, ProfilMobile, RapportMobile, Supplement } from './components/mobile/Suite'

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
  [/^\/tableau$/, () => <Tableau />],
  [/^\/entreprises$/, () => <Entreprises />],
  [/^\/consultation\/([\w-]+)$/, p => <Consultation id={p[0]} />],
  [/^\/devis\/([\w-]+)$/, p => <Devis id={p[0]} />],
  [/^\/portail\/([\w-]+)(?:\/([\w-]+))?$/, p => <Portail csId={p[0]} eid={p[1]} />],
  [/^\/fiche\/([\w,-]+)$/, p => <Fiche ids={p[0]} />],
  [/^\/classement$/, () => <Classement />],
  [/^\/referentiels$/, () => <Referentiels />],
  [/^\/ouvriers$/, () => <Ouvriers />],
  [/^\/carte$/, () => <Carte />],
  [/^\/m\/missions$/, (_p, q) => <MesMissions sig={q.sig} />],
  [/^\/m\/mission\/([\w-]+)$/, p => <MissionDetail rid={p[0]} />],
  [/^\/m\/terminer\/([\w-]+)$/, p => <Terminer rid={p[0]} />],
  [/^\/m\/supplement\/([\w-]+)$/, p => <Supplement rid={p[0]} />],
  [/^\/m\/rapport\/([\w-]+)$/, p => <RapportMobile rid={p[0]} />],
  [/^\/m\/constat$/, () => <ConstatMobile />],
  [/^\/m\/profil$/, () => <ProfilMobile />],
]

function Router() {
  const { path, query } = useRoute()
  useEffect(() => { window.scrollTo(0, 0) }, [path])
  for (const [re, render] of ROUTES) {
    const m = path.match(re)
    if (m) return <ErrorBoundary key={path}>{render(m.slice(1), query)}</ErrorBoundary>
  }
  return <ErrorBoundary key={path}><Demandes /></ErrorBoundary>
}

export default function App() {
  return (
    <AppProvider>
      <Router />
    </AppProvider>
  )
}
