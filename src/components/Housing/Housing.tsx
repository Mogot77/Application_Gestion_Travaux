import type { CSSProperties } from 'react'
import type { Logement } from '@/types'
import Chip from '@/components/ui/Chip'
import Empty from '@/components/ui/Empty'
import Kv from '@/components/ui/Kv'
import Opts from '@/components/ui/Opts'
import Layout from '@/components/Layout'
import Photo from '@/components/Photo'
import HousingTree from '@/components/HousingTree'
import InspectionsTable from '@/components/InspectionsTable'
import { useApp } from '@/hooks/useApp'
import { useUiState } from '@/hooks/useUiState'
import { CLOSED, batiCls, getLog, logAdr, piecesFor, profilOf, propCls, typoLabel } from '@/helpers/domain'
import { DEPTS } from '@/data/refs'
import { TODAY, diffDays, fdy, slug } from '@/helpers/dates'
import { docsFor } from '@/helpers/docs'
import { INIT } from './constants'
import { resume } from './helpers'
import LocationCard from './LocationCard'
import InterventionsTable from './InterventionsTable'
import type { LogTab, LogUi, HousingProps } from './types'
import SearchBox from '@/components/ui/SearchBox'
import Tabs from '@/components/ui/Tabs'

const Housing = ({ id }: HousingProps) => {
  const { S } = useApp()
  const [ui, setUi] = useUiState<LogUi>('log', INIT)
  const q = ui.q.toLowerCase()
  const list = S.logements.filter(l =>
    (!q || `${l.id} ${l.adresse} ${l.ville} ${l.crypto}`.toLowerCase().includes(q)) && (!ui.dept || l.dept === ui.dept) && (!ui.typo || l.typo === ui.typo) &&
    (!ui.etab || l.etab === ui.etab) && (S.profil !== 'etab' || l.etab === profilOf(S).etab))
  const sel = getLog(S, id) || list[0]
  const tab: LogTab = sel && ui.tabFor === sel.id ? ui.tab : 'synthese'
  const setTab = (t: LogTab) => sel && setUi({ tab: t, tabFor: sel.id })

  const groups: Record<string, Logement[]> = {}
  list.forEach(l => { const k = `${l.dept} › ${l.ville.toUpperCase()}`; (groups[k] = groups[k] || []).push(l) })


  const left = (
    <aside className="card min-w-[260px] self-stretch" style={{ flex: '0 1 330px' }}>
      <div className="flex flex-col gap-2.5 border-b border-line2 p-3.5">
        <div><strong>Logements</strong> <span className="muted">· {S.logements.filter(l => l.actif).length} actifs</span></div>
        <SearchBox value={ui.q} placeholder="N°, adresse, ville, ID Crypto" onChange={q => setUi({ q })} />
        <div className="row !gap-1.5">
          <select className={`flt${ui.dept ? ' on' : ''}`} value={ui.dept} onChange={e => setUi({ dept: e.target.value })}><Opts list={['77', '91']} placeholder="Dépt" /></select>
          <select className={`flt${ui.typo ? ' on' : ''}`} value={ui.typo} onChange={e => setUi({ typo: e.target.value })}><Opts list={['T2', 'T3', 'T4', 'BUR']} placeholder="Typologie" /></select>
          {S.profil !== 'etab' && <select className={`flt max-w-[150px]${ui.etab ? ' on' : ''}`} value={ui.etab} onChange={e => setUi({ etab: e.target.value })}><Opts list={[...new Set(S.logements.map(l => l.etab))]} placeholder="Établissement" /></select>}
        </div>
      </div>
      <div className="max-h-[760px] overflow-auto">
        {Object.entries(groups).map(([g, ls]) => (
          <div key={g}>
            <div className="small px-3.5 pb-1 pt-2.5 font-bold tracking-[.04em] text-muted">{g}</div>
            {ls.map(l => {
              const on = sel && l.id === sel.id
              return (
                <a key={l.id} href={`#/logement/${l.id}`} className={`block border-l-[3px] px-3.5 py-2.5 text-[13px] text-ink no-underline hover:text-ink ${on ? 'border-l-brand bg-brand-bg' : 'border-l-transparent'}`}>
                  <strong>{l.id}</strong> · {typoLabel(l)}{l.apt ? ' · apt ' + l.apt : ''}<small className="mt-0.5 block text-muted">{l.adresse} · {resume(S, l)}</small>
                </a>
              )
            })}
          </div>
        ))}
        {!list.length && <Empty>Aucun logement</Empty>}
      </div>
    </aside>
  )

  if (!sel) return <Layout active="logements"><div className="cols">{left}</div></Layout>

  const ds = S.demandes.filter(d => d.logementId === sel.id && d.statut !== 'brouillon').sort((a, b) => b.recueLe.localeCompare(a.recueLe))
  const cs = S.constats.filter(c => c.logementId === sel.id).sort((a, b) => b.date.localeCompare(a.date))
  const docs = docsFor(S, sel)
  const nDocs = docs.demandes.reduce((s, x) => s + x.files.length, 0) + docs.constats.length
  const pieces = piecesFor(S, sel).pieces
  const cnt: Record<string, { n: number; open: boolean }> = {}
  ds.filter(d => diffDays(d.recueLe, TODAY) <= 730).forEach(d => d.lignes.forEach(l => {
    cnt[l.piece] = cnt[l.piece] || { n: 0, open: false }
    cnt[l.piece].n++
    if (!CLOSED.includes(d.statut)) cnt[l.piece].open = true
  }))
  const lastC = cs[0]
  const tabs: [LogTab, string][] = [['synthese', 'Synthèse'], ['inter', `Interventions (${ds.length})`], ['constats', `Constats (${cs.length})`], ['docs', `Documents (${nDocs})`]]

  return (
    <Layout active="logements">
      <div className="cols !gap-4">
        {left}
        <section className="flex min-w-0 flex-col gap-4" style={{ flex: '999 1 640px' }}>
          <div className="card pad">
            <div className="row between items-start">
              <div>
                <div className="row !gap-2.5"><h1>{sel.id}</h1><Chip>{`${typoLabel(sel)} · ${sel.surface} m²`}</Chip><Chip tone={sel.actif ? 'ok' : 'gr'}>{sel.actif ? 'Actif' : 'Sorti du parc'}</Chip></div>
                <p className="muted mb-0 mt-1.5">{logAdr(sel)}, {sel.etage} — {sel.cp} {sel.ville}</p>
              </div>
              <div className="row !gap-2">
                <button className="btn" onClick={() => setTab('docs')}>Ouvrir le dossier documents</button>
                <a className="btn" href={`#/constat/new?log=${sel.id}`}>Nouveau constat</a>
                <a className="btn btnp" href={`#/demande/new?log=${sel.id}`}>Nouvelle demande</a>
              </div>
            </div>
            <div className="grid-auto mt-4 !gap-4" style={{ '--min': '300px' } as CSSProperties}>
              <Kv pairs={[['Établissement', sel.etab], ['Code section', sel.section], ['CGL', sel.cgl], ['Dispositif', sel.dispositif], ['Ménage', sel.menage]]} />
              <Kv pairs={[['ID Crypto', sel.crypto], ['Bailleur', sel.bailleur], ['Demande occupant', sel.dispositif === 'Solibail' ? 'Option activée' : 'Option désactivée'], ['Secteur ST', sel.secteur], ['Accès · clés', `${sel.acces || '—'} · ${sel.cles}`]]} />
            </div>
          </div>
          <Tabs className="!m-0" active={tab} onChange={setTab} tabs={tabs.map(([key, label]) => ({ key, label }))} />
          {tab === 'synthese' && (
            <div>
              <div className="cols !gap-4">
                <div className="card pad" style={{ flex: '1 1 380px' }}>
                  <h2 className="h2 mb-3">Pièces et historique</h2>
                  <div className="grid grid-cols-3 gap-2">
                    {pieces.map(p => {
                      const c = cnt[p]
                      return (
                        <div key={p} className={`flex min-h-[62px] flex-col gap-1 rounded-lg border p-2.5 text-xs ${c && c.open ? 'border-danger-line bg-[#FFFBFA]' : 'border-line bg-white'}`}>
                          <span className="font-semibold">{p}</span>
                          <b className={`font-medium ${c ? 'text-ink' : 'text-faint'}`}>{c ? `${c.n} intervention${c.n > 1 ? 's' : ''}${c.open ? ' · en cours' : ''}` : '—'}</b>
                        </div>
                      )
                    })}
                  </div>
                  <p className="muted small mb-0 mt-2.5">Nombre d'interventions par pièce sur 24 mois.</p>
                </div>
                <div className="card pad" style={{ flex: '1 1 300px' }}>
                  <h2 className="h2 mb-3">Dernier constat d'état</h2>
                  {lastC ? (
                    <>
                      <div className="row flex-nowrap items-start !gap-3.5"><Photo src={lastC.photos[0]} w={110} h={82} />
                        <div className="s13 flex flex-col gap-1.5">
                          <div><strong>{fdy(lastC.date)}</strong> · {lastC.contexte.toLowerCase()}</div>
                          <div>Propreté : <Chip tone={propCls(lastC.proprete)}>{lastC.proprete} / 6</Chip></div>
                          <div>Bâti : <Chip tone={batiCls(lastC.bati)}>{lastC.bati}</Chip></div>
                          <div className="muted">par {lastC.auteur}, {lastC.fonction.toLowerCase()}</div>
                        </div></div>
                      <button className="linkbtn s13 mt-3" onClick={() => setTab('constats')}>Historique des constats</button>
                    </>
                  ) : <p className="muted s13">Aucun constat enregistré.</p>}
                </div>
              </div>
              <LocationCard sel={sel} />
              <div className="card mt-4">
                <div className="row between px-[18px] pb-1.5 pt-4"><h2 className="h2">Interventions récentes</h2><span className="muted s13">{ds.filter(d => diffDays(d.recueLe, TODAY) <= 365).length} demande(s) sur 12 mois</span></div>
                <InterventionsTable ds={ds.slice(0, 5)} />
              </div>
            </div>
          )}
          {tab === 'inter' && <div className="card"><InterventionsTable ds={ds} /></div>}
          {tab === 'constats' && <div className="card tbl-wrap"><InspectionsTable list={cs} withLog={false} /></div>}
          {tab === 'docs' && (
            <>
              <div className="tree"><div className="text-[#94A3B8]">Travaux – Logements / {DEPTS[sel.dept]} / {slug(sel.ville)} /</div><HousingTree l={sel} open /></div>
              <p className="muted small">Dossiers et noms créés par l'outil, jamais à la main. <a href="#/classement">Voir le plan de classement complet</a></p>
            </>
          )}
        </section>
      </div>
    </Layout>
  )
}

export default Housing
