import { useTheme } from '@/hooks/useTheme'
import { useAuth } from '@/hooks/useAuth'
import { useApp } from '@/hooks/useApp'
import { uniqueEtabs } from '@/helpers/domain'
import { ROLES, type Role } from '@/helpers/roles'
import LayoutView from './LayoutView'
import { buildPlayModel, navFor } from './helpers'
import type { LayoutProps } from './types'

/** Coque commune des écrans : branche l'authentification, le thème et l'état de l'application sur la vue. */
const Layout = ({ active = '', children }: LayoutProps) => {
  const { user, logout, role, realRole, play, setPlay } = useAuth()
  const { S } = useApp()
  const { theme, toggle: toggleTheme } = useTheme()

  const onPlayRole = (r: Role) => {
    setPlay(r === 'directeur' ? null : { role: r, etab: ROLES[r].needsEtab ? uniqueEtabs(S)[0] ?? '' : '', ouvrierId: r === 'ouvrier' ? S.ouvriers[0]?.id ?? '' : '' })
  }

  return (
    <LayoutView
      active={active}
      nav={navFor(role)}
      canCreate={!!role && ROLES[role].creerDemande}
      play={realRole === 'directeur' ? buildPlayModel(S, play) : undefined}
      roleLabel={realRole !== 'directeur' && role ? ROLES[role].label : undefined}
      email={user?.email ?? undefined}
      theme={theme}
      loggedIn={!!user}
      onPlayRole={onPlayRole}
      onPlayEtab={etab => { if (play) setPlay({ ...play, etab }) }}
      onPlayOuvrier={ouvrierId => { if (play) setPlay({ ...play, ouvrierId }) }}
      onToggleTheme={toggleTheme}
      onLogout={() => void logout()}
    >
      {children}
    </LayoutView>
  )
}

export default Layout
