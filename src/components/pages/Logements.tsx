import { useMemo, useState } from 'react'
import type { Demande, Logement } from '../../types'
import { useApp } from '../../hooks/useApp'
import { useUiState } from '../../store/ui'
import { Layout } from '../layout/Layout'
import { Chip, StatChip } from '../ui/Chip'
import { Kv, Opts } from '../ui/Fields'
import { IcSearch } from '../ui/Icons'
import { MapView, type MapSpec } from '../ui/MapView'
import { Photo } from '../ui/Photo'
import { TreeLog } from '../ui/Tree'
import { ConstatsTable } from '../ui/ConstatsTable'
import { CLOSED, QUALIF, batiCls, circuitOf, getLog, logAdr, nextRdv, piecesFor, profilOf, propCls, typoLabel } from '../../lib/domain'
import { DEPOT, approx, baseHtml, geocode, pinHtml, posLog } from '../../lib/carto'
import { DEPTS } from '../../data/refs'
import { TODAY, diffDays, fd, fdy, slug } from '../../lib/dates'
import { docsFor } from '../../lib/docs'

type LogTab = 'synthese' | 'inter' | 'constats' | 'docs'
interface LogUi { q: string; dept: string; typo: string; etab: string; tab: LogTab; tabFor: string }
const INIT: LogUi = { q: '', dept: '', typo: '', etab: '', tab: 'synthese', tabFor: '' }

function TblInter({ ds }: { ds: Demande[] }) {
  const { S } = useApp()
  if (!ds.length) return <div className="empty">Aucune intervention</div>
  const interDate = (d: Demande) => { const r = nextRdv(S, d); return r ? r.date : d.dateIntervention || '' }
  return (
    <div className="tbl-wrap"><table className="t"><thead><tr><th>Date</th><th>N°</th><th>Pièce · travaux</th><th>Circuit</th><th>Imputation</th><th>Statut</th><th>Rapport</th></tr></thead>
      <tbody>
        {ds.map(d => {
          const di = interDate(d)
          const done = ['realisee', 'cloturee'].includes(d.statut)
          return (
            <tr key={d.id}>
              <td>{di ? fd(di) + (di > TODAY || d.statut === 'planifiee' ? ' (prévue)' : '') : <>{fd(d.recueLe)} <small>demande</small></>}</td>
              <td><a href={`#/demande/${d.id}`}>{d.id}</a></td>
              <td>{d.lignes.map(l => l.piece).filter((v, i, a) => a.indexOf(v) === i).join(', ')} · {d.lignes.map(l => l.nature).join(', ')}</td>
              <td>{circuitOf(S, d) || '—'}</td>
              <td>{[...new Set(d.lignes.map(l => l.imputation.replace(' (refacturation)', '')))].join(' / ')}</td>
              <td><StatChip d={d} /></td>
              <td>{done ? <a href={`#/fiche/${d.id}`}>PDF</a> : <span className="muted">—</span>}</td>
            </tr>
          )
        })}
      </tbody></table></div>
  )
}

function LocalisationCard({ sel }: { sel: Logement }) {
  const { S, mutate, toast } = useApp()
  const [busy, setBusy] = useState(false)
  const spec = useMemo<MapSpec>(() => ({
    maxZoom: 16,
    markers: [
      { pos: DEPOT, html: baseHtml('D'), size: [26, 26], title: 'Dépôt ST' },
      {
        pos: posLog(S, sel), html: pinHtml('', '#1D4ED8', 32), size: [32, 32], draggable: true, z: 1000, title: `${sel.id} · glisser pour repositionner`,
        onDrag: p => {
          mutate(s => { const l = getLog(s, sel.id); if (l) { l.lat = Math.round(p[0] * 1e6) / 1e6; l.lng = Math.round(p[1] * 1e6) / 1e6 } }, { now: true })
          toast('Position enregistrée', 'ok')
        },
      },
    ],
  }), [S, sel, mutate, toast])
  const focus = useMemo(() => ({ key: sel.id + (approx(sel) ? '~' : '='), c: posLog(S, sel), z: 15 }), [S, sel])

  const geo = () => {
    setBusy(true)
    geocode(sel.adresse, sel.cp, sel.ville).then(p => {
      if (!p) { toast('Adresse introuvable : placez le repère à la main', 'err'); return }
      mutate(s => { const l = getLog(s, sel.id); if (l) { l.lat = p[0]; l.lng = p[1] } }, { now: true })
      toast('Adresse géolocalisée', 'ok')
    }).catch((e: Error) => toast('Géocodage impossible : ' + e.message, 'err')).finally(() => setBusy(false))
  }
  const reset = () => mutate(s => { const l = getLog(s, sel.id); if (l) { delete l.lat; delete l.lng } }, { now: true })

  return (
    <div className="card mt-4 overflow-hidden">
      <div className="row between px-[18px] py-3.5"><h2 className="h2">Localisation</h2>
        <div className="row !gap-2">{approx(sel) ? <Chip tone="h48">Position approximative</Chip> : <Chip tone="ok">Position précise</Chip>}
          <button className="btn btn-sm" disabled={busy} onClick={geo}>{busy ? 'Recherche…' : "Géolocaliser l'adresse"}</button>
          {!approx(sel) && <button className="btn btn-sm" onClick={reset}>Réinitialiser</button>}</div></div>
      <MapView spec={spec} mapKey={'log-' + sel.id} focus={focus} height={300} className="!rounded-none" />
      <p className="muted small m-0 px-[18px] py-2.5">{approx(sel) ? `Repère placé au centre de ${sel.ville}. ` : ''}Déplacez le repère à la main ou utilisez « Géolocaliser l'adresse » (recherche OpenStreetMap, connexion internet nécessaire).</p>
    </div>
  )
}

export function Logements({ id }: { id?: string }) {
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

  const resume = (l: Logement) => {
    const ds = S.demandes.filter(d => d.logementId === l.id && !CLOSED.includes(d.statut) && d.statut !== 'brouillon')
    const c = S.constats.filter(x => x.logementId === l.id).sort((a, b) => b.date.localeCompare(a.date))[0]
    if (ds.some(d => d.statut === 'en_cours')) return 'intervention en cours'
    if (ds.some(d => d.statut === 'a_reactualiser')) return 'demande à réactualiser'
    if (ds.some(d => QUALIF.includes(d.statut))) return `${ds.length} demande${ds.length > 1 ? 's' : ''} dont à qualifier`
    if (ds.length) return `${ds.length} demande${ds.length > 1 ? 's' : ''} en cours`
    if (c && c.proprete <= 2) return `constat « ${S.ref.proprete[c.proprete].toLowerCase()} » le ${fd(c.date)}`
    return 'aucune demande en cours'
  }

  const left = (
    <aside className="card min-w-[260px] self-stretch" style={{ flex: '0 1 330px' }}>
      <div className="flex flex-col gap-2.5 border-b border-line2 p-3.5">
        <div><strong>Logements</strong> <span className="muted">· {S.logements.filter(l => l.actif).length} actifs</span></div>
        <label className="flt cursor-text"><IcSearch />
          <input className="min-w-0 flex-1 border-0 outline-0" style={{ font: 'inherit' }} value={ui.q} placeholder="N°, adresse, ville, ID Crypto" onChange={e => setUi({ q: e.target.value })} />
        </label>
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
                  <strong>{l.id}</strong> · {typoLabel(l)}{l.apt ? ' · apt ' + l.apt : ''}<small className="mt-0.5 block text-muted">{l.adresse} · {resume(l)}</small>
                </a>
              )
            })}
          </div>
        ))}
        {!list.length && <div className="empty">Aucun logement</div>}
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
                <a className="btn" href={`#/m/constat?log=${sel.id}`}>Nouveau constat</a>
                <a className="btn btnp" href={`#/demande/new?log=${sel.id}`}>Nouvelle demande</a>
              </div>
            </div>
            <div className="grid-auto mt-4 !gap-4" style={{ '--min': '300px' } as React.CSSProperties}>
              <Kv pairs={[['Établissement', sel.etab], ['Code section', sel.section], ['CGL', sel.cgl], ['Dispositif', sel.dispositif], ['Ménage', sel.menage]]} />
              <Kv pairs={[['ID Crypto', sel.crypto], ['Bailleur', sel.bailleur], ['Demande occupant', sel.dispositif === 'Solibail' ? 'Option activée' : 'Option désactivée'], ['Secteur ST', sel.secteur], ['Accès · clés', `${sel.acces || '—'} · ${sel.cles}`]]} />
            </div>
          </div>
          <nav className="tabs !m-0">
            {tabs.map(([k, l]) => <button key={k} className={`tab${tab === k ? ' on' : ''}`} onClick={() => setTab(k)}>{l}</button>)}
          </nav>
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
              <LocalisationCard sel={sel} />
              <div className="card mt-4">
                <div className="row between px-[18px] pb-1.5 pt-4"><h2 className="h2">Interventions récentes</h2><span className="muted s13">{ds.filter(d => diffDays(d.recueLe, TODAY) <= 365).length} demande(s) sur 12 mois</span></div>
                <TblInter ds={ds.slice(0, 5)} />
              </div>
            </div>
          )}
          {tab === 'inter' && <div className="card"><TblInter ds={ds} /></div>}
          {tab === 'constats' && <div className="card tbl-wrap"><ConstatsTable list={cs} withLog={false} /></div>}
          {tab === 'docs' && (
            <>
              <div className="tree"><div className="text-[#94A3B8]">Travaux – Logements / {DEPTS[sel.dept]} / {slug(sel.ville)} /</div><TreeLog l={sel} open /></div>
              <p className="muted small">Dossiers et noms créés par l'outil, jamais à la main. <a href="#/classement">Voir le plan de classement complet</a></p>
            </>
          )}
        </section>
      </div>
    </Layout>
  )
}
