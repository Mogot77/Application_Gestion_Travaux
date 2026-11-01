import { useState, type ReactNode } from 'react'
import type { ProfilKey } from '../../types'
import { useApp } from '../../hooks/useApp'
import { useAuth } from '../../hooks/useAuth'
import { PROFILS } from '../../lib/domain'

const NAV: [string, string, string][] = [
  ['demandes', 'Demandes', '#/demandes'],
  ['planning', 'Planning', '#/planning'],
  ['ouvriers', 'Ouvriers', '#/ouvriers'],
  ['entreprises', 'Entreprises', '#/entreprises'],
  ['logements', 'Logements', '#/logements'],
  ['carte', 'Carte', '#/carte'],
  ['constats', 'Constats', '#/constats'],
  ['tableau', 'Tableau de bord', '#/tableau'],
  ['classement', 'Documents', '#/classement'],
  ['referentiels', 'Référentiels', '#/referentiels'],
]

/** Coque commune des écrans : en-tête de navigation (menu repliable sur petit écran) + contenu. */
export function Layout({ active = '', children }: { active?: string; children?: ReactNode }) {
  const { S, mutate, toast } = useApp()
  const { user, logout, isAdmin } = useAuth()
  const [open, setOpen] = useState(false)
  const nav = isAdmin ? [...NAV, ['utilisateurs', 'Utilisateurs', '#/utilisateurs'] as [string, string, string]] : NAV
  const onProfil = (k: ProfilKey) => {
    mutate(s => { s.profil = k }, { now: true })
    toast('Profil : ' + PROFILS[k].label)
  }
  return (
    <>
      <header className="noprint sticky top-0 z-20 bg-nav px-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 lg:flex-nowrap">
          <a className="py-4 text-[17px] font-bold text-white no-underline hover:text-white" href="#/demandes">Equalis · Travaux</a>
          <a className="btn btnp btn-sm ml-auto lg:order-last lg:ml-0" href="#/demande/new">+ <span className="hidden sm:inline">Nouvelle demande</span><span className="sm:hidden">Demande</span></a>
          <button
            type="button" className="grid size-10 place-items-center rounded-lg text-white lg:hidden"
            aria-label="Menu" aria-expanded={open} aria-controls="nav-principal" onClick={() => setOpen(o => !o)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
          <div id="nav-principal" className={`${open ? 'flex' : 'hidden'} w-full flex-col gap-3 pb-3 lg:order-none lg:flex lg:w-auto lg:flex-1 lg:flex-row lg:items-center lg:justify-between lg:pb-0`}>
            <nav className="flex flex-col lg:flex-row lg:flex-wrap lg:gap-[18px]" aria-label="Onglets">
              {nav.map(([k, l, h]) => (
                <a
                  key={k} href={h}
                  className={`py-2.5 text-sm no-underline hover:text-white lg:border-b-[3px] lg:pb-[15px] lg:pt-[18px] ${k === active ? 'font-semibold text-white lg:border-b-[#60a5fa]' : 'text-[#c3cad4] lg:border-b-transparent'}`}
                >{l}</a>
              ))}
            </nav>
            <div className="flex flex-wrap items-center gap-3 lg:py-2">
              <select
                className="h-8 max-w-full rounded-lg border border-[#4b5563] bg-[#374151] px-2 text-[13px] font-medium text-[#e5e7eb] lg:max-w-[220px]"
                aria-label="Profil connecté" value={S.profil} onChange={e => onProfil(e.target.value as ProfilKey)}
              >
                {(Object.entries(PROFILS) as [ProfilKey, (typeof PROFILS)[ProfilKey]][]).map(([k, p]) => <option key={k} value={k}>{p.label}</option>)}
              </select>
              {user && (
                <button
                  type="button" className="text-[13px] text-[#d1d5db] hover:text-white"
                  title={user.email ?? undefined} onClick={() => void logout()}
                >Déconnexion</button>
              )}
            </div>
          </div>
        </div>
      </header>
      <main className="main mx-auto max-w-[1440px] p-4 sm:p-6">{children}</main>
    </>
  )
}
