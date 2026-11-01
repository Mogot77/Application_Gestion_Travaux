import type { ReactNode } from 'react'
import type { ProfilKey } from '../../types'
import { useApp } from '../../hooks/useApp'
import { PROFILS } from '../../lib/domain'
import { IcPhone } from '../ui/Icons'

const NAV: [string, string, string][] = [
  ['demandes', 'Demandes', '#/demandes'],
  ['planning', 'Planning', '#/planning'],
  ['ouvriers', 'Ouvriers', '#/ouvriers'],
  ['logements', 'Logements', '#/logements'],
  ['carte', 'Carte', '#/carte'],
  ['constats', 'Constats', '#/constats'],
  ['tableau', 'Tableau de bord', '#/tableau'],
  ['classement', 'Documents', '#/classement'],
  ['referentiels', 'Référentiels', '#/referentiels'],
]

/** Coque commune des écrans bureau : en-tête de navigation + contenu. */
export function Layout({ active = '', children }: { active?: string; children?: ReactNode }) {
  const { S, mutate, toast } = useApp()
  const onProfil = (k: ProfilKey) => {
    mutate(s => { s.profil = k }, { now: true })
    toast('Profil : ' + PROFILS[k].label)
  }
  return (
    <>
      <header className="noprint sticky top-0 z-20 flex flex-wrap items-center gap-x-5 gap-y-2 bg-nav px-4 sm:px-6">
        <a className="py-4 text-[17px] font-bold text-white no-underline hover:text-white" href="#/demandes">Equalis · Travaux</a>
        <nav className="flex flex-1 flex-wrap gap-[18px]" aria-label="Onglets">
          {NAV.map(([k, l, h]) => (
            <a
              key={k} href={h}
              className={`border-b-[3px] pb-[15px] pt-[18px] text-sm no-underline hover:text-white ${k === active ? 'border-b-[#60a5fa] font-semibold text-white' : 'border-b-transparent text-[#c3cad4]'}`}
            >{l}</a>
          ))}
        </nav>
        <div className="flex flex-wrap items-center gap-3 py-2">
          <a className="btn btnp btn-sm" href="#/demande/new">+ Nouvelle demande</a>
          <a className="inline-flex items-center gap-1.5 text-[13px] text-[#d1d5db] no-underline hover:text-white" href="#/m/missions"><IcPhone /> Mobile</a>
          <select
            className="h-8 max-w-[220px] rounded-lg border border-[#4b5563] bg-[#374151] px-2 text-[13px] font-medium text-[#e5e7eb]"
            aria-label="Profil connecté" value={S.profil} onChange={e => onProfil(e.target.value as ProfilKey)}
          >
            {(Object.entries(PROFILS) as [ProfilKey, (typeof PROFILS)[ProfilKey]][]).map(([k, p]) => <option key={k} value={k}>{p.label}</option>)}
          </select>
        </div>
      </header>
      <main className="main mx-auto max-w-[1440px] p-4 sm:p-6">{children}</main>
    </>
  )
}
