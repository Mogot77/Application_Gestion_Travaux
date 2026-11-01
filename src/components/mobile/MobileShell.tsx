import type { ReactNode } from 'react'
import { useApp } from '../../hooks/useApp'
import { meOf } from '../../lib/mobile'
import { IcBack, IcHome, IcList, IcPlus, IcUser } from '../ui/Icons'

export type MobileTab = 'missions' | 'constat' | 'signaler' | 'profil'

/** Coque « téléphone » de l'application mobile (barre d'onglets en bas). */
export function MobileShell({ tab, children }: { tab?: MobileTab; children?: ReactNode }) {
  const { S } = useApp()
  const me = meOf(S)
  const run = S.rdvs.find(r => r.ouvrierId === me.id && r.etat === 'running')
  const items: [MobileTab, string, string, (p: { c?: string }) => ReactNode][] = [
    ['missions', 'Missions', '#/m/missions', IcList],
    ['constat', 'Constat', '#/m/constat', IcHome],
    ['signaler', 'Signaler', run ? `#/m/supplement/${run.id}` : '#/m/missions?sig=1', IcPlus],
    ['profil', 'Profil', '#/m/profil', IcUser],
  ]
  return (
    <div className="mshell">
      <div className="mshell-bar noprint"><a href="#/planning">← Interface bureau</a><span className="muted">Application mobile · {me.nom}</span></div>
      <div className="phone">
        <div className="phone-scroll">{children}</div>
        {tab && (
          <nav className="tabbar" aria-label="Navigation">
            {items.map(([k, l, h, Ic]) => <a key={k} href={h} className={tab === k ? 'on' : ''}><Ic c={tab === k ? '#1D4ED8' : '#5B6472'} />{l}</a>)}
          </nav>
        )}
      </div>
    </div>
  )
}

/** En-tête blanc avec bouton retour. */
export function BackHead({ href, title, sub, right }: { href: string; title: ReactNode; sub: ReactNode; right?: ReactNode }) {
  return (
    <div className="mhead white">
      <a className="mback" href={href} aria-label="Retour"><IcBack /></a>
      <div className="min-w-0 flex-1"><div className="s">{sub}</div><h1>{title}</h1></div>
      {right}
    </div>
  )
}
