import Empty from '@/components/ui/Empty'
import { URG } from '@/helpers/domain'
import { DAY_MAX } from '@/helpers/planning'
import { TODAY, dayShort, fdayLong, nowTime, parse } from '@/helpers/dates'
import CardTag from './CardTag'
import LoadBar from './LoadBar'
import { fdurS } from './helpers'
import type { PlanningViewProps } from './types'

/** Vue pure du planning : file « À planifier », grille ouvriers × jours et panneau latéral fourni par le conteneur. */
const PlanningView = ({ model, side, onPrevWeek, onNextWeek, onThisWeek, onFilter, onSelectCard, onCell, onSelectRdv, onDropCard, onMap }: PlanningViewProps) => {
  const { days, isCurrentWeek, queueCount, fUrg, queue, rows, hors, todayIds } = model
  return (
    <>
      <div className="pagehead">
        <div className="t"><h1 className="mr-1.5">Planning du service technique</h1>
          <button className="btn btn-sm" aria-label="Semaine précédente" onClick={onPrevWeek}>‹</button>
          <strong>{parse(days[0]).getDate()} – {fdayLong(days[4]).replace(/^\S+ /, '')} {days[4].slice(0, 4)}</strong>
          <button className="btn btn-sm" aria-label="Semaine suivante" onClick={onNextWeek}>›</button>
          {!isCurrentWeek && <button className="linkbtn s13" onClick={onThisWeek}>Cette semaine</button>}
        </div>
        <div className="row !gap-2.5">
          <span className="muted s13">Agendas Outlook synchronisés à {nowTime()}</span>
          <div className="seg w-auto"><button className="on !px-3.5">Semaine</button><button className="!px-3.5" onClick={onMap}>Carte</button></div>
          <a className="btn" href={`#/fiche/${todayIds.join(',') || 'none'}`}>Imprimer les fiches du jour</a>
        </div>
      </div>
      <div className="plan">
        <aside className="card plan-q">
          <div className="row between"><strong>À planifier</strong><span className="muted s13">{queueCount} demande{queueCount > 1 ? 's' : ''}</span></div>
          <div className="row !gap-1.5">
            {(['', 'urgent', 'h48', 'prog'] as const).map(k => (
              <button key={k} className={`btn btn-sm${fUrg === k ? ' btnp' : ''}`} onClick={() => onFilter(k)}>{k ? URG[k][0] : 'Toutes'}</button>
            ))}
          </div>
          {queue.map(({ d, cls, selected, ville, dept, typo, logId, summary, info }) => (
            <div key={d.id} className={`qcard ${cls}${selected ? ' sel' : ''}`} draggable
              onDragStart={e => { e.dataTransfer.setData('text/plain', d.id); e.dataTransfer.effectAllowed = 'move' }}
              onClick={() => onSelectCard(d.id)}>
              <div className="row between"><strong>{d.id}</strong><CardTag d={d} /></div>
              <div className="muted">{ville} ({dept}) · {typo} · {logId}</div>
              <div>{summary}</div>
              <div className="muted">{info}</div>
            </div>
          ))}
          {!queue.length && <Empty>Rien à planifier 🎉</Empty>}
          <p className="muted small mb-0 mt-1">Glisser une carte sur un créneau : l'ouvrier est affecté et le rendez-vous part dans son agenda.</p>
        </aside>
        <section className="card plan-g">
          <div className="pgrid">
            <div className="hd">Ouvriers</div>
            {days.map(dt => <div key={dt} className={`hd${dt === TODAY ? ' today' : ''}`}>{dayShort(dt)} {parse(dt).getDate()}{dt === TODAY ? " · aujourd'hui" : ''}</div>)}
            {rows.map(({ o, week, cells }) => (
              <div key={o.id} className="contents">
                <div className="wk"><strong>{o.nom}</strong>{o.metier}<LoadBar min={week} max={DAY_MAX * 5} /></div>
                {cells.map(cell => (
                  <div key={cell.date} className={`cell${cell.today ? ' today' : ''}`}
                    onClick={() => onCell(o.id, cell.date)}
                    onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('over') }}
                    onDragLeave={e => e.currentTarget.classList.remove('over')}
                    onDrop={e => {
                      e.preventDefault()
                      e.currentTarget.classList.remove('over')
                      onDropCard(e.dataTransfer.getData('text/plain'), o.id, cell.date)
                    }}>
                    {cell.blocks.map(({ r, icon, cls, selected }) => (
                      <div key={r.id} className={`blk ${cls}${selected ? ' sel' : ''}`} title={`${r.debut} · ${r.label}`}
                        onClick={e => { e.stopPropagation(); onSelectRdv(r.id) }}>
                        <span>{icon}{r.label}</span><span>{r.etat === 'imp' ? 'Report nécessaire' : fdurS(r.duree)}</span>
                      </div>
                    ))}
                    {cell.ghost && <div className="blk ghost"><span>{cell.ghost.label}</span><span>{cell.ghost.dur}</span></div>}
                    {!cell.blocks.length && !cell.ghost && <span className="avail">Disponible</span>}
                    <LoadBar min={cell.load} />
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="row between muted small px-3.5 py-2.5">
            <span>✓ réalisée · ▶ en cours · ⚠ accès impossible · pointillé : en cours de planification</span>
            <span>Hors planning ST : {hors} intervention{hors > 1 ? 's' : ''} bailleur / prestataire</span>
          </div>
        </section>
        <aside className="card plan-s">{side}</aside>
      </div>
    </>
  )
}

export default PlanningView
