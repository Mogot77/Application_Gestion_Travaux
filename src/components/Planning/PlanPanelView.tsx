import { useState } from 'react'
import Opts from '@/components/ui/Opts'
import Note from '@/components/ui/Note'
import { TODAY, fday, fdur } from '@/helpers/dates'
import CardTag from './CardTag'
import type { PlanPanelViewProps } from './types'

/** Vue pure du panneau « fiche mission » : seul le brouillon de consommable est un état local. */
const PlanPanelView = ({ model, onOuvrier, onDate, onDebut, onToggleConso, onRemoveConso, onAddConso, onPlan, onClose }: PlanPanelViewProps) => {
  const [cnom, setCnom] = useState('')
  const [cqte, setCqte] = useState('1')
  const [corg, setCorg] = useState('Stock')
  const { d, log, adr, lignes, dur, ouvOptions, ouvrierId, date, debut, slots, fin, warn, canPlan } = model

  const add = () => {
    if (onAddConso(cnom, cqte, corg)) { setCnom(''); setCqte('1') }
  }

  return (
    <>
      <div className="small muted font-bold tracking-[.05em]">FICHE MISSION</div>
      <div className="row between"><strong className="text-base"><a href={`#/demande/${d.id}`}>{d.id}</a></strong><CardTag d={d} /></div>
      <div className="s13">{log?.id} · {log?.typo} · {log?.ville} ({log?.dept})<div className="muted">{adr} · clés : {(d.lieuCles || '').toLowerCase()}</div></div>
      <div className="s13 leading-[1.6]">
        {lignes.map((l, i) => <div key={i}><strong>{i + 1} · {l.piece} — {l.nature}</strong> · {fdur(l.duree)}</div>)}
      </div>
      <div><span className="lbl">Durée estimée (coordinatrice)</span><div className="in ro"><strong>{fdur(dur)}</strong><span className="muted small">somme des lignes</span></div></div>
      <div><label className="lbl" htmlFor="pouv">Ouvrier</label>
        <select className="in" id="pouv" value={ouvrierId} onChange={e => onOuvrier(e.target.value)}>
          <Opts placeholder="Choisir…" list={ouvOptions} />
        </select></div>
      <div className="grid grid-cols-[1fr_110px] gap-2.5">
        <div><label className="lbl" htmlFor="pdate">Date</label><input className="in" type="date" id="pdate" value={date} min={TODAY} onChange={e => onDate(e.target.value)} /></div>
        <div><label className="lbl" htmlFor="pdeb">Début</label><select className="in" id="pdeb" value={debut} onChange={e => onDebut(e.target.value)}><Opts list={slots} placeholder="—" /></select></div>
      </div>
      {debut && date && <div className="s13">Créneau : <strong>{fday(date)} · {debut} – {fin}</strong></div>}
      {warn && <Note tone="warn">{warn}</Note>}
      <div><span className="lbl">Consommables à prévoir</span>
        {d.consommables.map((c, i) => (
          <div key={i} className="row between s13 flex-nowrap py-1">
            <label className="row flex-nowrap !gap-2"><input type="checkbox" checked={c.pris} onChange={e => onToggleConso(i, e.target.checked)} /> {c.nom} × {c.qte} · <span className={c.origine === 'Stock' ? 'muted' : 'font-semibold text-warn'}>{c.origine.toLowerCase()}</span></label>
            <button className="linkbtn small" onClick={() => onRemoveConso(i)}>×</button>
          </div>
        ))}
        {!d.consommables.length && <div className="muted small">Aucun</div>}
        <div className="mt-1.5 grid grid-cols-[minmax(0,1fr)_46px_92px] gap-1.5">
          <input className="in sm" placeholder="Désignation" value={cnom} onChange={e => setCnom(e.target.value)} />
          <input className="in sm" type="number" min={1} aria-label="Quantité" value={cqte} onChange={e => setCqte(e.target.value)} />
          <select className="in sm" value={corg} onChange={e => setCorg(e.target.value)}><Opts list={['Stock', 'À acheter']} /></select>
        </div>
        <button className="btn btn-sm mt-1.5" onClick={add}>+ Ajouter</button>
      </div>
      <button className="btn btnp btn-w" disabled={!canPlan} onClick={onPlan}>Planifier et envoyer à l'agenda</button>
      <div className="row !gap-2">
        <a className="btn btn-sm" href={`#/fiche/${d.id}`}>Imprimer</a><a className="btn btn-sm" href={`#/demande/${d.id}`}>Ouvrir</a>
        <button className="linkbtn small" onClick={onClose}>Fermer</button>
      </div>
    </>
  )
}

export default PlanPanelView
