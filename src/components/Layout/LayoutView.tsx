import { useState } from 'react'
import Icon from '@/components/ui/Icon'
import type { Role } from '@/helpers/roles'
import type { LayoutViewProps } from './types'

/** Coque commune des écrans (vue) : en-tête de navigation (menu repliable sur petit écran) + contenu. */
const LayoutView = ({ active = '', children, nav, canCreate, play, roleLabel, email, theme, loggedIn, onPlayRole, onPlayEtab, onPlayOuvrier, onToggleTheme, onLogout }: LayoutViewProps) => {
  const [open, setOpen] = useState(false)
  return (
    <>
      <header className="noprint sticky top-0 z-20 bg-nav px-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 lg:flex-nowrap">
          <a className="py-4 text-[17px] font-bold text-white no-underline hover:text-white" href="#/demandes">Travaux</a>
          {canCreate && <a className="btn btnp btn-sm ml-auto lg:order-last lg:ml-0" href="#/demande/new">+ <span className="hidden sm:inline">Nouvelle demande</span><span className="sm:hidden">Demande</span></a>}
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
              {play ? (
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    className="h-8 max-w-full rounded-lg border border-[#4b5563] bg-[#374151] px-2 text-[13px] font-medium text-[#e5e7eb]"
                    aria-label="Statut de l'utilisateur (test : jouer un rôle)" title="Statut de l'utilisateur · le directeur peut tester les autres rôles" value={play.role}
                    onChange={e => onPlayRole(e.target.value as Role)}
                  >
                    {play.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  {play.etabs && (
                    <select className="h-8 max-w-[200px] rounded-lg border border-[#4b5563] bg-[#374151] px-2 text-[13px] text-[#e5e7eb]" aria-label="Établissement joué"
                      value={play.etab} onChange={e => onPlayEtab(e.target.value)}>
                      {play.etabs.map(x => <option key={x} value={x}>{x}</option>)}
                    </select>
                  )}
                  {play.ouvriers && (
                    <select className="h-8 max-w-[200px] rounded-lg border border-[#4b5563] bg-[#374151] px-2 text-[13px] text-[#e5e7eb]" aria-label="Ouvrier joué"
                      value={play.ouvrierId} onChange={e => onPlayOuvrier(e.target.value)}>
                      {play.ouvriers.map(o => <option key={o.id} value={o.id}>{o.nom}</option>)}
                    </select>
                  )}
                </div>
              ) : roleLabel && <span className="max-w-full truncate text-[13px] font-medium text-[#e5e7eb] lg:max-w-[260px]" title={email}>{roleLabel}</span>}
              <button
                type="button" className="grid size-8 place-items-center rounded-lg text-[#d1d5db] hover:text-white"
                aria-label={theme === 'dark' ? 'Passer au thème clair' : 'Passer au thème sombre'}
                title={theme === 'dark' ? 'Thème clair' : 'Thème sombre'} onClick={onToggleTheme}
              ><Icon name={theme === 'dark' ? 'sun' : 'moon'} /></button>
              {loggedIn && (
                <button
                  type="button" className="text-[13px] text-[#d1d5db] hover:text-white"
                  title={email} onClick={onLogout}
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

export default LayoutView
