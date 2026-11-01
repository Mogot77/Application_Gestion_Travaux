import { useMemo } from 'react'
import type { AppState, Logement } from '../../types'
import { useApp } from '../../hooks/useApp'
import { useUiState } from '../../store/ui'
import { Layout } from '../layout/Layout'
import { MapView, type MapMarker, type MapSpec } from '../ui/MapView'
import { Opts } from '../ui/Fields'
import { DEPOT, approx, baseHtml, pinHtml, posLog } from '../../lib/carto'
import { CLOSED, logAdr, profilOf, uniqueEtabs } from '../../lib/domain'
import { esc } from '../../lib/dates'

interface CrtUi { dept: string; etab: string; mode: 'tous' | 'demandes' | 'urgent' }
const INIT: CrtUi = { dept: '', etab: '', mode: 'tous' }

const info = (S: AppState, l: Logement) => {
  const ds = S.demandes.filter(d => d.logementId === l.id && !CLOSED.includes(d.statut) && d.statut !== 'brouillon')
  const urgent = ds.some(d => d.urgence === 'urgent')
  return { ds, urgent, color: urgent ? '#B42318' : ds.length ? '#B54708' : '#6B7280' }
}

export function Carte() {
  const { S } = useApp()
  const [ui, setUi] = useUiState<CrtUi>('crt', INIT)
  const list = S.logements.filter(l => l.actif !== false
    && (S.profil !== 'etab' || l.etab === profilOf(S).etab || l.typo === 'BUR')
    && (!ui.dept || l.dept === ui.dept)
    && (!ui.etab || l.etab === ui.etab)
    && (ui.mode === 'tous' || (ui.mode === 'urgent' ? info(S, l).urgent : info(S, l).ds.length > 0)))
  const withD = list.filter(l => info(S, l).ds.length)
  const nUrg = list.filter(l => info(S, l).urgent).length
  const nApprox = list.filter(l => approx(l)).length

  const spec = useMemo<MapSpec>(() => {
    const markers: MapMarker[] = [{ pos: DEPOT, html: baseHtml('D'), size: [26, 26], title: 'Dépôt ST · Vaux-le-Pénil' }]
    list.forEach(l => {
      const x = info(S, l)
      markers.push({
        pos: posLog(S, l), html: pinHtml(x.ds.length ? String(x.ds.length) : '', x.color, 28), size: [28, 28], title: `${l.id} · ${l.ville}`, z: x.urgent ? 500 : x.ds.length ? 300 : 0,
        popup: `<strong>${esc(l.id)}</strong> · ${esc(l.typo === 'BUR' ? 'Bureaux' : l.typo)}<br>${esc(logAdr(l))}, ${esc(l.cp)} ${esc(l.ville)}<br><span style="color:#5B6472">${esc(l.etab)}</span>${approx(l) ? '<br><span style="color:#B54708">Position approximative</span>' : ''}`
          + (x.ds.length ? '<div style="margin-top:6px">' + x.ds.map(d => `<a href="#/demande/${esc(d.id)}">${esc(d.id)}</a> · ${esc(d.lignes[0].nature)}`).join('<br>') + '</div>' : '')
          + `<div style="margin-top:8px"><a href="#/logement/${esc(l.id)}">Fiche logement</a> · <a href="#/demande/new?log=${esc(l.id)}">Nouvelle demande</a></div>`,
      })
    })
    return { markers }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [S, ui.dept, ui.etab, ui.mode])

  return (
    <Layout active="carte">
      <div className="pagehead">
        <div><h1 className="mb-1">Carte des logements</h1><p className="muted m-0">{list.length} logement{list.length > 1 ? 's' : ''} affiché{list.length > 1 ? 's' : ''} · {withD.length} avec une demande en cours{nUrg ? ` dont ${nUrg} urgente${nUrg > 1 ? 's' : ''}` : ''}.</p></div>
        <div className="row !gap-2">
          <select className={`flt${ui.dept ? ' on' : ''}`} value={ui.dept} onChange={e => setUi({ dept: e.target.value })}><Opts list={[{ v: '77', l: '77 · Seine-et-Marne' }, { v: '91', l: '91 · Essonne' }]} placeholder="Tous départements" /></select>
          {S.profil !== 'etab' && <select className={`flt${ui.etab ? ' on' : ''}`} value={ui.etab} onChange={e => setUi({ etab: e.target.value })}><Opts list={uniqueEtabs(S)} placeholder="Tous établissements" /></select>}
          <select className={`flt${ui.mode !== 'tous' ? ' on' : ''}`} value={ui.mode} onChange={e => setUi({ mode: e.target.value as CrtUi['mode'] })}><Opts list={[{ v: 'tous', l: 'Tous les logements' }, { v: 'demandes', l: 'Avec demande en cours' }, { v: 'urgent', l: 'Avec urgence' }]} /></select>
        </div>
      </div>
      <div className="cols !gap-4">
        <section className="card min-w-0 overflow-hidden" style={{ flex: '999 1 640px' }}><MapView spec={spec} mapKey="carte" refitKey={`${ui.dept}|${ui.etab}|${ui.mode}`} height={680} className="!rounded-[10px]" /></section>
        <aside className="col-side" style={{ flex: '1 1 300px' }}>
          <div className="card pad"><h2 className="h2 mb-2.5">Légende</h2>
            <div className="stack s13" style={{ '--gap': '8px' } as React.CSSProperties}>
              <div className="row flex-nowrap !gap-2"><span dangerouslySetInnerHTML={{ __html: pinHtml('2', '#B42318', 22) }} />Demande urgente en cours</div>
              <div className="row flex-nowrap !gap-2"><span dangerouslySetInnerHTML={{ __html: pinHtml('1', '#B54708', 22) }} />Demande en cours</div>
              <div className="row flex-nowrap !gap-2"><span dangerouslySetInnerHTML={{ __html: pinHtml('', '#6B7280', 22) }} />Aucune demande en cours</div>
              <div className="row flex-nowrap !gap-2"><span dangerouslySetInnerHTML={{ __html: baseHtml('D') }} />Dépôt ST · Vaux-le-Pénil</div>
            </div>
            <p className="muted small mb-0 mt-3">Le chiffre indique le nombre de demandes en cours.{nApprox ? ` ${nApprox} logement${nApprox > 1 ? 's sont placés' : ' est placé'} au centre de leur commune : ouvrez la fiche logement pour les géolocaliser.` : ''}</p></div>
          <div className="card pad"><h2 className="h2 mb-2.5">Demandes en cours</h2>
            {withD.length ? (
              <div className="stack" style={{ '--gap': '8px' } as React.CSSProperties}>
                {withD.map(l => {
                  const x = info(S, l)
                  return (
                    <a key={l.id} href={`#/logement/${l.id}`} className="block rounded-lg border border-line border-l-4 px-2.5 py-2 text-[13px] text-inherit no-underline" style={{ borderLeftColor: x.color }}>
                      <strong>{l.id}</strong> · {l.ville}
                      <div className="muted small">{x.ds.map(d => d.id.slice(-4)).join(', ')} · {x.ds.length} demande{x.ds.length > 1 ? 's' : ''}{x.urgent ? ' · urgent' : ''}</div>
                    </a>
                  )
                })}
              </div>
            ) : <div className="muted s13">Aucune demande en cours sur ce périmètre.</div>}
          </div>
        </aside>
      </div>
    </Layout>
  )
}
