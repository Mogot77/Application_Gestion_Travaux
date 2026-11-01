import { useEffect, type DragEvent } from 'react'
import { useApp } from '@/hooks/useApp'
import { go, useRoute } from '@/hooks/useRoute'
import { useUiState } from '@/hooks/useUiState'
import { getUi, patchUi } from '@/helpers/uiState'
import Layout from '@/components/Layout'
import Empty from '@/components/ui/Empty'
import {
  URG, chargeOf, dureeST, firstFree, getD, getLog, ouvActifs, rdvsOf, shortLot,
} from '@/helpers/domain'
import { DAY_MAX, PLAN_INIT, PLAN_KEY, type PlanUi } from '@/helpers/planning'
import { TODAY, addDays, dayShort, fd, fdayLong, fdur, nowTime, parse, weekStart } from '@/helpers/dates'
import CardTag from './CardTag'
import LoadBar from './LoadBar'
import PlanPanel from './PlanPanel'
import AppointmentPanel from './AppointmentPanel'
import { cardCls, fdurS, getRdv, planQueue, rdvClass } from './helpers'
const Planning = () => {
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
                <div className="row between"><strong>{d.id}</strong><CardTag d={d} /></div>
                <div className="muted">{log?.ville} ({log?.dept}) · {log?.typo} · {log?.id}</div>
                <div>{l0.piece} — {shortLot(l0.lot)} · {l0.nature}{d.lignes.length > 1 ? ' · +' + (d.lignes.length - 1) : ''}</div>
                <div className="muted">{imp ? `Report nécessaire le ${fd(imp.date)} (${imp.motifImp || ''})` : `Durée estimée ${fdur(dureeST(d))}`}</div>
              </div>
            )
          })}
          {!Q.length && <Empty>Rien à planifier 🎉</Empty>}
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
          {sel ? <PlanPanel d={sel} ui={ui} setUi={setUi} />
            : rdvSel ? <AppointmentPanel r={rdvSel} setUi={setUi} />
              : <div className="muted s13">Sélectionnez une demande à planifier (ou glissez-la sur un créneau), ou cliquez sur un rendez-vous pour le consulter.</div>}
        </aside>
      </div>
    </Layout>
  )
}

export default Planning
