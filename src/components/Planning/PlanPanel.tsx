import { useState } from 'react'
import type { Rdv, Demande } from '@/types'
import { useApp } from '@/hooks/useApp'
import Opts from '@/components/ui/Opts'
import Note from '@/components/ui/Note'
import { chargeOf, dureeST, firstFree, getD, getLog, getOuv, hist, logAdr, nextId, ouvActifs, rdvsOf } from '@/helpers/domain'
import { DAY_MAX } from '@/helpers/planning'
import { TODAY, fday, fdur, toMin, toTime, weekStart } from '@/helpers/dates'
import CardTag from './CardTag'
import { fdurS, startSlots } from './helpers'
import type { PlanPanelProps } from './types'
import { reserveIds } from '@/store/queries/counters'

const PlanPanel = ({ d, ui, setUi }: PlanPanelProps) => {
  const { S, mutate, getS, toast } = useApp()
  const [cnom, setCnom] = useState('')
  const [cqte, setCqte] = useState('1')
  const [corg, setCorg] = useState('Stock')
  const log = getLog(S, d.logementId)
  const dur = dureeST(d)
  const debs = startSlots()
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
  const planifier = async () => {
    const o = getOuv(S, ui.ouvrierId)
    if (!o || !ui.date || !ui.debut) return toast('Choisissez un ouvrier, une date et un créneau', 'err')
    if (!getD(getS(), d.id)?.ft) await reserveIds(getS(), ['ft'])
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
      <div className="row between"><strong className="text-base"><a href={`#/demande/${d.id}`}>{d.id}</a></strong><CardTag d={d} /></div>
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
      {warn && <Note tone="warn">{warn}</Note>}
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

export default PlanPanel
