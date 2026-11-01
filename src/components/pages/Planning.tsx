import { useEffect, useState, type DragEvent } from 'react'
import type { Demande, Rdv } from '../../types'
import { useApp } from '../../hooks/useApp'
import { go, useRoute } from '../../hooks/useRoute'
import { getUi, patchUi, useUiState } from '../../store/ui'
import { Layout } from '../layout/Layout'
import { Chip } from '../ui/Chip'
import { Kv, Opts } from '../ui/Fields'
import {
  RDV_ETAT, URG, chargeOf, dureeST, firstFree, getD, getLog, getOuv, getRdv, hist, logAdr, nextId, ouvActifs, rdvClass, rdvsOf, shortLot,
} from '../../lib/domain'
import { DAY_MAX, PLAN_INIT, PLAN_KEY, planQueue, type PlanUi } from '../../lib/planning'
import { TODAY, addDays, dayShort, fd, fday, fdayLong, fdur, fdurS, nowTime, parse, toMin, toTime, weekStart } from '../../lib/dates'

const cardCls = (d: Demande) => d.statut === 'acces_impossible' ? 'u' : ({ urgent: 'u', h48: 'h48', prog: 'pg' }[d.urgence])
const cardTag = (d: Demande) => d.statut === 'acces_impossible' ? <Chip tone="u">REPROG.</Chip> : d.origine === 'supp' ? <Chip tone="tl">AJOUT SUR PLACE</Chip> : <Chip tone={URG[d.urgence][1]}>{URG[d.urgence][2]}</Chip>

function LoadBar({ min, max = DAY_MAX }: { min: number; max?: number }) {
  return (
    <div className="load">{fdurS(min)} / {fdurS(max)}
      <div className="bar"><span className={min > max ? 'full' : ''} style={{ width: `${Math.min(100, Math.round(min / max * 100))}%` }}></span></div>
    </div>
  )
}

export function Planning() {
  const { S, getS } = useApp()
  const { query: q } = useRoute()
  const [ui, setUi] = useUiState<PlanUi>(PLAN_KEY, PLAN_INIT)

  // Arrivée depuis une demande (?sel=…) : présélection ou affichage du rendez-vous existant
  useEffect(() => {
    if (!q.sel) return
    const cur = getUi(PLAN_KEY, PLAN_INIT)
    if (q.sel === cur.lastQ) return
    const patch: Partial<PlanUi> = { lastQ: q.sel, demandeId: q.sel, rdvSel: '', ouvrierId: '', date: '', debut: '' }
    if (q.w) patch.week = weekStart(q.w)
    const s = getS()
    const d = getD(s, q.sel)
    const r = d && s.rdvs.filter(x => x.demandeId === d.id && x.etat !== 'imp').sort((a, b) => (b.date + b.debut).localeCompare(a.date + a.debut))[0]
    if (d && d.statut !== 'a_planifier' && d.statut !== 'acces_impossible' && r) Object.assign(patch, { demandeId: '', rdvSel: r.id, week: weekStart(r.date) })
    patchUi(PLAN_KEY, PLAN_INIT, patch)
  }, [q.sel, q.w, getS])

  const ws = ui.week || weekStart(TODAY)
  const days = [0, 1, 2, 3, 4].map(i => addDays(ws, i))
  const all = planQueue(S.demandes)
  const Q = all.filter(d => !ui.fUrg || d.urgence === ui.fUrg)
  const sel = ui.demandeId ? getD(S, ui.demandeId) : undefined
  const hors = S.demandes.filter(d => ['bailleur', 'prestataire'].includes(d.statut)).length
  const rdvSel = ui.rdvSel ? getRdv(S, ui.rdvSel) : undefined
  const todayIds = S.rdvs.filter(r => r.date === TODAY && r.demandeId && r.etat === 'planned').map(r => r.demandeId)

  const onDrop = (e: DragEvent, o: string, dt: string) => {
    e.preventDefault()
    e.currentTarget.classList.remove('over')
    const id = e.dataTransfer.getData('text/plain')
    if (!getD(S, id)) return
    setUi({ demandeId: id, rdvSel: '', ouvrierId: o, date: dt, debut: firstFree(S, o, dt) })
  }

  return (
    <Layout active="planning">
      <div className="pagehead">
        <div className="t"><h1 className="mr-1.5">Planning du service technique</h1>
          <button className="btn btn-sm" aria-label="Semaine précédente" onClick={() => setUi({ week: addDays(ws, -7) })}>‹</button>
          <strong>{parse(days[0]).getDate()} – {fdayLong(days[4]).replace(/^\S+ /, '')} {days[4].slice(0, 4)}</strong>
          <button className="btn btn-sm" aria-label="Semaine suivante" onClick={() => setUi({ week: addDays(ws, 7) })}>›</button>
          {ws !== weekStart(TODAY) && <button className="linkbtn s13" onClick={() => setUi({ week: weekStart(TODAY) })}>Cette semaine</button>}
        </div>
        <div className="row !gap-2.5">
          <span className="muted s13">Agendas Outlook synchronisés à {nowTime()}</span>
          <div className="seg w-auto"><button className="on !px-3.5">Semaine</button><button className="!px-3.5" onClick={() => go('#/tournees')}>Carte</button></div>
          <a className="btn" href={`#/fiche/${todayIds.join(',') || 'none'}`}>Imprimer les fiches du jour</a>
        </div>
      </div>
      <div className="plan">
        <aside className="card plan-q">
          <div className="row between"><strong>À planifier</strong><span className="muted s13">{all.length} demande{all.length > 1 ? 's' : ''}</span></div>
          <div className="row !gap-1.5">
            {(['', 'urgent', 'h48', 'prog'] as const).map(k => (
              <button key={k} className={`btn btn-sm${ui.fUrg === k ? ' btnp' : ''}`} onClick={() => setUi({ fUrg: k })}>{k ? URG[k][0] : 'Toutes'}</button>
            ))}
          </div>
          {Q.map(d => {
            const log = getLog(S, d.logementId)
            const l0 = d.lignes[0]
            const imp = S.rdvs.find(r => r.demandeId === d.id && r.etat === 'imp')
            return (
              <div key={d.id} className={`qcard ${cardCls(d)}${ui.demandeId === d.id ? ' sel' : ''}`} draggable
                onDragStart={e => { e.dataTransfer.setData('text/plain', d.id); e.dataTransfer.effectAllowed = 'move' }}
                onClick={() => { if (ui.demandeId !== d.id) setUi({ demandeId: d.id, rdvSel: '', ouvrierId: '', date: '', debut: '' }) }}>
                <div className="row between"><strong>{d.id}</strong>{cardTag(d)}</div>
                <div className="muted">{log?.ville} ({log?.dept}) · {log?.typo} · {log?.id}</div>
                <div>{l0.piece} — {shortLot(l0.lot)} · {l0.nature}{d.lignes.length > 1 ? ' · +' + (d.lignes.length - 1) : ''}</div>
                <div className="muted">{imp ? `Report nécessaire le ${fd(imp.date)} (${imp.motifImp || ''})` : `Durée estimée ${fdur(dureeST(d))}`}</div>
              </div>
            )
          })}
          {!Q.length && <div className="empty">Rien à planifier 🎉</div>}
          <p className="muted small mb-0 mt-1">Glisser une carte sur un créneau : l'ouvrier est affecté et le rendez-vous part dans son agenda.</p>
        </aside>
        <section className="card plan-g">
          <div className="pgrid">
            <div className="hd">Ouvriers</div>
            {days.map(dt => <div key={dt} className={`hd${dt === TODAY ? ' today' : ''}`}>{dayShort(dt)} {parse(dt).getDate()}{dt === TODAY ? " · aujourd'hui" : ''}</div>)}
            {ouvActifs(S).map(o => {
              const week = days.reduce((s, dt) => s + chargeOf(S, o.id, dt), 0)
              return (
                <div key={o.id} className="contents">
                  <div className="wk"><strong>{o.nom}</strong>{o.metier}<LoadBar min={week} max={DAY_MAX * 5} /></div>
                  {days.map(dt => {
                    const list = rdvsOf(S, o.id, dt)
                    const ghost = !!sel && ui.ouvrierId === o.id && ui.date === dt
                    const load = chargeOf(S, o.id, dt) + (ghost && sel ? dureeST(sel) : 0)
                    return (
                      <div key={dt} className={`cell${dt === TODAY ? ' today' : ''}`}
                        onClick={() => { if (ui.demandeId) setUi({ ouvrierId: o.id, date: dt, debut: firstFree(S, o.id, dt) }) }}
                        onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('over') }}
                        onDragLeave={e => e.currentTarget.classList.remove('over')}
                        onDrop={e => onDrop(e, o.id, dt)}>
                        {list.map(r => {
                          const icon = { done: '✓ ', running: '▶ ', imp: '⚠ ', planned: '' }[r.etat]
                          const cls = r.etat === 'imp' ? 'imp' : `${rdvClass(S, r)}${r.etat === 'done' ? ' done' : ''}`
                          return (
                            <div key={r.id} className={`blk ${cls}${ui.rdvSel === r.id ? ' sel' : ''}`} title={`${r.debut} · ${r.label}`}
                              onClick={e => { e.stopPropagation(); setUi({ rdvSel: r.id, demandeId: '' }) }}>
                              <span>{icon}{r.label}</span><span>{r.etat === 'imp' ? 'Report nécessaire' : fdurS(r.duree)}</span>
                            </div>
                          )
                        })}
                        {ghost && sel && <div className="blk ghost"><span>{sel.id.slice(-4)} {sel.lignes[0].nature}</span><span>{fdurS(dureeST(sel))}</span></div>}
                        {!list.length && !ghost && <span className="avail">Disponible</span>}
                        <LoadBar min={load} />
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
          <div className="row between muted small px-3.5 py-2.5">
            <span>✓ réalisée · ▶ en cours · ⚠ accès impossible · pointillé : en cours de planification</span>
            <span>Hors planning ST : {hors} intervention{hors > 1 ? 's' : ''} bailleur / prestataire</span>
          </div>
        </section>
        <aside className="card plan-s">
          {sel ? <PanelPlan d={sel} ui={ui} setUi={setUi} />
            : rdvSel ? <PanelRdv r={rdvSel} setUi={setUi} />
              : <div className="muted s13">Sélectionnez une demande à planifier (ou glissez-la sur un créneau), ou cliquez sur un rendez-vous pour le consulter.</div>}
        </aside>
      </div>
    </Layout>
  )
}

type SetUi = (p: Partial<PlanUi>) => void

function PanelPlan({ d, ui, setUi }: { d: Demande; ui: PlanUi; setUi: SetUi }) {
  const { S, mutate, toast } = useApp()
  const [cnom, setCnom] = useState('')
  const [cqte, setCqte] = useState('1')
  const [corg, setCorg] = useState('Stock')
  const log = getLog(S, d.logementId)
  const dur = dureeST(d)
  const debs: string[] = []
  for (let t = toMin('07:30'); t <= toMin('17:00'); t += 30) debs.push(toTime(t))
  const fin = ui.debut ? toTime(toMin(ui.debut) + dur) : ''
  let warn = ''
  if (ui.ouvrierId && ui.date && ui.debut) {
    const s = toMin(ui.debut), e = s + dur
    const clash = rdvsOf(S, ui.ouvrierId, ui.date).find(r => r.etat !== 'imp' && s < toMin(r.debut) + r.duree && toMin(r.debut) < e)
    if (clash) warn = `Chevauche ${clash.label} (${clash.debut}).`
    else if (chargeOf(S, ui.ouvrierId, ui.date) + dur > DAY_MAX) warn = 'Dépasse 7 h sur la journée.'
    if (ui.date < TODAY) warn = 'Date passée.'
  }

  const setOuv = (v: string) => setUi({ ouvrierId: v, ...(ui.date ? { debut: firstFree(S, v, ui.date) } : {}) })
  const setDate = (v: string) => setUi({ date: v, ...(ui.ouvrierId && v ? { debut: firstFree(S, ui.ouvrierId, v) } : {}), ...(v ? { week: weekStart(v) } : {}) })
  const upd = (fn: (x: Demande) => void) => mutate(s => { const x = getD(s, d.id); if (x) fn(x) })

  const addConso = () => {
    const nom = cnom.trim()
    if (!nom) return toast('Désignation du consommable ?', 'err')
    upd(x => { x.consommables.push({ nom, qte: Number(cqte) || 1, origine: corg, pris: false }) })
    setCnom(''); setCqte('1')
  }
  const planifier = () => {
    const o = getOuv(S, ui.ouvrierId)
    if (!o || !ui.date || !ui.debut) return toast('Choisissez un ouvrier, une date et un créneau', 'err')
    let rdv: Rdv | undefined
    mutate(s => {
      const x = getD(s, d.id)
      if (!x) return
      const r: Rdv = { id: 'R' + Date.now(), ouvrierId: o.id, date: ui.date, debut: ui.debut, duree: dureeST(x), label: `${x.id.slice(-4)} ${x.lignes[0].nature.split(' ')[0]}`, etat: 'planned', demandeId: x.id }
      s.rdvs.push(r)
      x.ft = x.ft || nextId(s, 'ft')
      x.statut = 'planifiee'
      x.lignes.forEach(l => { if (l.circuit === 'ST' && !l.statut) l.statut = 'planifiee' })
      hist(x, `Planifiée ${fday(ui.date)} ${ui.debut} · ${o.nom}`)
      hist(x, `Rendez-vous envoyé dans l'agenda Outlook de ${o.nom} · statut visible par l'établissement`)
      rdv = r
    }, { now: true })
    if (!rdv) return
    setUi({ demandeId: '', ouvrierId: '', date: '', debut: '', rdvSel: rdv.id })
    toast(`${d.id} planifiée ${fday(rdv.date)} à ${rdv.debut} avec ${o.nom}`, 'ok')
  }

  return (
    <>
      <div className="small muted font-bold tracking-[.05em]">FICHE MISSION</div>
      <div className="row between"><strong className="text-base"><a href={`#/demande/${d.id}`}>{d.id}</a></strong>{cardTag(d)}</div>
      <div className="s13">{log?.id} · {log?.typo} · {log?.ville} ({log?.dept})<div className="muted">{logAdr(log)} · clés : {(d.lieuCles || '').toLowerCase()}</div></div>
      <div className="s13 leading-[1.6]">
        {d.lignes.filter(l => l.circuit === 'ST' || !l.circuit).map((l, i) => <div key={i}><strong>{i + 1} · {l.piece} — {l.nature}</strong> · {fdur(l.duree)}</div>)}
      </div>
      <div><span className="lbl">Durée estimée (coordinatrice)</span><div className="in ro"><strong>{fdur(dur)}</strong><span className="muted small">somme des lignes</span></div></div>
      <div><label className="lbl" htmlFor="pouv">Ouvrier</label>
        <select className="in" id="pouv" value={ui.ouvrierId} onChange={e => setOuv(e.target.value)}>
          <Opts placeholder="Choisir…" list={ouvActifs(S).map(o => { const c = ui.date ? chargeOf(S, o.id, ui.date) : null; return { v: o.id, l: `${o.nom} — ${o.metier}${c != null ? ` · ${c >= DAY_MAX ? 'complet' : fdurS(c) + ' / 7h'}` : ''}` } })} />
        </select></div>
      <div className="grid grid-cols-[1fr_110px] gap-2.5">
        <div><label className="lbl" htmlFor="pdate">Date</label><input className="in" type="date" id="pdate" value={ui.date} min={TODAY} onChange={e => setDate(e.target.value)} /></div>
        <div><label className="lbl" htmlFor="pdeb">Début</label><select className="in" id="pdeb" value={ui.debut} onChange={e => setUi({ debut: e.target.value })}><Opts list={debs} placeholder="—" /></select></div>
      </div>
      {ui.debut && ui.date && <div className="s13">Créneau : <strong>{fday(ui.date)} · {ui.debut} – {fin}</strong></div>}
      {warn && <div className="note warn">{warn}</div>}
      <div><span className="lbl">Consommables à prévoir</span>
        {d.consommables.map((c, i) => (
          <div key={i} className="row between s13 flex-nowrap py-1">
            <label className="row flex-nowrap !gap-2"><input type="checkbox" checked={c.pris} onChange={e => upd(x => { x.consommables[i].pris = e.target.checked })} /> {c.nom} × {c.qte} · <span className={c.origine === 'Stock' ? 'muted' : 'font-semibold text-warn'}>{c.origine.toLowerCase()}</span></label>
            <button className="linkbtn small" onClick={() => upd(x => { x.consommables.splice(i, 1) })}>×</button>
          </div>
        ))}
        {!d.consommables.length && <div className="muted small">Aucun</div>}
        <div className="mt-1.5 grid grid-cols-[minmax(0,1fr)_46px_92px] gap-1.5">
          <input className="in sm" placeholder="Désignation" value={cnom} onChange={e => setCnom(e.target.value)} />
          <input className="in sm" type="number" min={1} aria-label="Quantité" value={cqte} onChange={e => setCqte(e.target.value)} />
          <select className="in sm" value={corg} onChange={e => setCorg(e.target.value)}><Opts list={['Stock', 'À acheter']} /></select>
        </div>
        <button className="btn btn-sm mt-1.5" onClick={addConso}>+ Ajouter</button>
      </div>
      <button className="btn btnp btn-w" disabled={!(ui.ouvrierId && ui.date && ui.debut)} onClick={planifier}>Planifier et envoyer à l'agenda</button>
      <div className="row !gap-2">
        <a className="btn btn-sm" href={`#/fiche/${d.id}`}>Imprimer</a><a className="btn btn-sm" href={`#/demande/${d.id}`}>Ouvrir</a>
        <button className="linkbtn small" onClick={() => setUi({ demandeId: '', ouvrierId: '', date: '', debut: '' })}>Fermer</button>
      </div>
    </>
  )
}

function PanelRdv({ r, setUi }: { r: Rdv; setUi: SetUi }) {
  const { S, mutate, toast } = useApp()
  const o = getOuv(S, r.ouvrierId)
  const d = r.demandeId ? getD(S, r.demandeId) : undefined
  const log = d && getLog(S, d.logementId)
  const [el, ec] = RDV_ETAT[r.etat]

  const cancel = () => {
    mutate(s => {
      s.rdvs = s.rdvs.filter(x => x.id !== r.id)
      const x = getD(s, r.demandeId)
      if (x && !s.rdvs.some(y => y.demandeId === x.id && y.etat === 'planned')) { x.statut = 'a_planifier'; hist(x, `Rendez-vous du ${fday(r.date)} annulé · à replanifier`) }
    }, { now: true })
    setUi({ rdvSel: '' })
    toast('Rendez-vous annulé')
  }
  const move = () => {
    if (!d) return
    mutate(s => {
      s.rdvs = s.rdvs.filter(x => x.id !== r.id)
      const x = getD(s, d.id)
      if (x) { x.statut = 'a_planifier'; hist(x, `Rendez-vous du ${fday(r.date)} déplacé`) }
    })
    setUi({ rdvSel: '', demandeId: d.id, ouvrierId: r.ouvrierId, date: r.date, debut: r.debut })
  }

  return (
    <>
      <div className="small muted font-bold tracking-[.05em]">RENDEZ-VOUS</div>
      <div className="row between"><strong className="text-base">{d ? <a href={`#/demande/${d.id}`}>{d.id}</a> : r.label}</strong><Chip tone={ec}>{el}</Chip></div>
      <Kv pairs={[
        ['Ouvrier', o?.nom], ['Date', fday(r.date)], ['Horaire', `${r.debut} – ${toTime(toMin(r.debut) + r.duree)}`],
        ['Logement', log ? `${log.id} · ${log.ville}` : '—'], ['Travaux', d ? d.lignes.map(l => l.piece + ' · ' + l.nature).join(', ') : r.label],
      ]} />
      {r.motifImp && <div className="note warn">Report nécessaire : {r.motifImp}</div>}
      {r.rapport && <div className="note">Temps passé {fdur(r.rapport.tempsMin)} · {r.rapport.conso.length} consommable(s)</div>}
      <div className="row !gap-2">
        {d && <a className="btn btn-sm" href={`#/fiche/${d.id}`}>{r.rapport ? 'Rapport' : 'Fiche'}</a>}
        {d && r.etat === 'planned' && <button className="btn btn-sm" onClick={move}>Déplacer</button>}
        {r.etat === 'planned' && <button className="btn btn-sm btnd" onClick={cancel}>Annuler</button>}
      </div>
    </>
  )
}
