import { useEffect } from 'react'
import type { Rdv } from '../../types'
import { useApp } from '../../hooks/useApp'
import { go } from '../../hooks/useRoute'
import { BackHead, MobileShell } from './MobileShell'
import { Chip, UrgChip } from '../ui/Chip'
import { Opts } from '../ui/Fields'
import { Photo } from '../ui/Photo'
import { IcNav, IcPlay, IcTel } from '../ui/Icons'
import { elapsed, ensureWork, meOf, stLines, useTick } from '../../lib/mobile'
import { getD, getLog, getRdv, hist, logAdr, nbPhotos, rdvsOf, getOuv, shortLot } from '../../lib/domain'
import { TODAY, addDays, dayShort, fday, fdur, now, nowTime, parse, toMin, toTime, weekStart } from '../../lib/dates'
import { readPhoto } from '../../lib/photos'

/* =====================================================================
   M1 · Mes missions
   ===================================================================== */
function MissionCard({ r }: { r: Rdv }) {
  const { S } = useApp()
  useTick(15000)
  const d = r.demandeId ? getD(S, r.demandeId) : undefined
  const log = getLog(S, d?.logementId)
  const chip = r.etat === 'done' ? <Chip tone="ok">Terminée</Chip>
    : r.etat === 'running' ? <Chip tone="ok">En cours · {fdur(elapsed(r))}</Chip>
      : r.etat === 'imp' ? <Chip tone="u">Accès impossible</Chip>
        : d ? <UrgChip k={d.lignes[0].urgence || d.urgence} /> : <Chip tone="pg">Prévue</Chip>
  const href = !d ? '' : r.etat === 'done' ? `#/m/rapport/${r.id}` : r.etat === 'running' ? `#/m/terminer/${r.id}` : `#/m/mission/${r.id}`
  const cls = `mc${r.etat === 'running' ? ' run' : ''}${r.etat === 'done' ? ' done' : ''}`
  const inner = (
    <>
      <div className="r1"><strong>{r.debut} · {d ? d.id : 'Mission'}</strong>{chip}</div>
      {d && log ? (
        <>
          <div className="font-semibold">{d.lignes[0].piece} · {shortLot(d.lignes[0].lot)} — {d.lignes[0].nature}{d.lignes.length > 1 ? ' + ' + (d.lignes.length - 1) : ''}</div>
          <div className="muted mt-0.5">{log.ville} · {logAdr(log)}{r.etat === 'done' ? ' · rapport envoyé' : ''}</div>
          {r.etat === 'planned' && (
            <div className="row muted small mt-2 !gap-2.5"><span>Durée est. {fdur(r.duree)}</span><span>{d.consommables.length} consommable{d.consommables.length > 1 ? 's' : ''}</span><span>{nbPhotos(d)} photo{nbPhotos(d) > 1 ? 's' : ''}</span></div>
          )}
          {r.etat === 'running' && <div className="mbtn green mt-2.5 !h-10 !text-sm">Reprendre la mission</div>}
        </>
      ) : <div className="muted">{r.label} · {fdur(r.duree)}</div>}
    </>
  )
  return href ? <a className={cls} href={href}>{inner}</a> : <div className={cls}>{inner}</div>
}

export function MesMissions({ sig }: { sig?: string }) {
  const { S, mutate, toast } = useApp()
  const o = meOf(S)
  const day = S.mobile.day || TODAY
  const ws = weekStart(TODAY)
  const days = [0, 1, 2, 3, 4].map(i => addDays(ws, i))
  const list = rdvsOf(S, o.id, day)
  const tomorrow = addDays(day, parse(day).getDay() === 5 ? 3 : 1)
  const next = rdvsOf(S, o.id, tomorrow)
  const tot = list.reduce((s, r) => s + r.duree, 0)

  useEffect(() => {
    if (sig) toast('Démarrez une mission pour signaler des travaux supplémentaires')
  }, [sig, toast])

  return (
    <MobileShell tab="missions">
      <div className="mhead"><div className="s">{o.nom} · {o.metier}</div><h1>Mes missions</h1></div>
      <div className="days">{days.map(dt => (
        <button key={dt} className={`day${dt === day ? ' on' : ''}`} onClick={() => mutate(s => { s.mobile.day = dt })}>{dayShort(dt)}<b>{parse(dt).getDate()}</b></button>
      ))}</div>
      <div className="mbody">
        <div className="row between s13"><strong>{list.length} mission{list.length > 1 ? 's' : ''} {day === TODAY ? "aujourd'hui" : 'le ' + fday(day)}</strong><span className="muted">{fdur(tot)} estimées</span></div>
        {list.map(r => <MissionCard key={r.id} r={r} />)}
        {!list.length && <div className="empty">Aucune mission ce jour-là.</div>}
        {next.length > 0 && (
          <>
            <div className="small muted mt-1.5 font-bold tracking-[.05em]">{tomorrow === addDays(TODAY, 1) ? 'DEMAIN' : fday(tomorrow).toUpperCase()}</div>
            {next.map(r => <MissionCard key={r.id} r={r} />)}
          </>
        )}
      </div>
    </MobileShell>
  )
}

/* =====================================================================
   M2 · Détail et démarrage
   ===================================================================== */
export function MissionDetail({ rid }: { rid: string }) {
  const { S, mutate, toast, openModal } = useApp()
  const r = getRdv(S, rid)
  const d = r?.demandeId ? getD(S, r.demandeId) : undefined
  if (!r || !d) return <MobileShell tab="missions"><div className="mbody"><div className="empty">Mission introuvable. <a href="#/m/missions">Retour</a></div></div></MobileShell>
  const log = getLog(S, d.logementId)
  if (!log) return null
  const lines = stLines(d)
  const running = S.rdvs.find(x => x.ouvrierId === r.ouvrierId && x.etat === 'running' && x.id !== r.id)
  const canStart = r.etat === 'planned' && r.date === TODAY
  const maps = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(`${log.adresse}, ${log.cp} ${log.ville}`)

  const start = () => {
    mutate(s => {
      const x = getRdv(s, rid); const dm = getD(s, x?.demandeId)
      if (!x || !dm) return
      x.etat = 'running'; x.debutReel = now(); ensureWork(x, dm)
      dm.statut = 'en_cours'; hist(dm, `Mission démarrée par ${getOuv(s, x.ouvrierId)?.nom} à ${nowTime()}`)
    }, { now: true })
    go('#/m/terminer/' + rid)
  }
  const imp = () => openModal({
    title: 'Accès impossible', okLabel: 'Signaler à la coordination', danger: true,
    body: (
      <>
        <div><label className="lbl">Motif</label><select className="in" name="m"><Opts list={S.ref.motifsAcces} /></select></div>
        <div><label className="lbl">Photo (porte, boîte aux lettres…) — obligatoire</label><input type="file" accept="image/*" capture="environment" name="ph" className="in !p-2" /></div>
        <div><label className="lbl">Commentaire</label><textarea className="in" name="c" /></div>
      </>
    ),
    onOk(fd) {
      const file = fd.get('ph')
      if (!(file instanceof File) || !file.size) { toast('Photo obligatoire', 'err'); return false }
      const motif = String(fd.get('m')); const comm = String(fd.get('c') || '')
      readPhoto(file).then(ph => {
        mutate(s => {
          const x = getRdv(s, rid); const dm = getD(s, x?.demandeId)
          if (!x || !dm) return
          x.etat = 'imp'; x.motifImp = motif; x.photoImp = ph; x.finReel = now()
          dm.statut = 'acces_impossible'
          hist(dm, `Accès impossible (${motif}) signalé par ${getOuv(s, x.ouvrierId)?.nom}${comm ? ' : ' + comm : ''} · à reprogrammer`)
        }, { now: true })
        toast('Coordination prévenue · mission à reprogrammer', 'ok')
        go('#/m/missions')
      }).catch(() => toast('Photo illisible', 'err'))
    },
  })

  return (
    <MobileShell tab="missions">
      <BackHead href="#/m/missions" title={d.id} sub={`${r.date === TODAY ? "Aujourd'hui" : fday(r.date)} · ${r.debut} – ${toTime(toMin(r.debut) + r.duree)}`} right={<UrgChip k={d.lignes[0].urgence || d.urgence} />} />
      <div className="mbody">
        <div className="msec"><div className="k">Adresse</div><div className="text-base font-bold">{logAdr(log)}</div><div className="muted s13">{log.cp} {log.ville} · {log.id} · {log.typo}</div>
          <div className="row mt-3 !gap-2"><a className="mbtn sec flex-1" href={maps} target="_blank" rel="noopener noreferrer"><IcNav /> Itinéraire</a><a className="mbtn sec flex-1" href={`tel:${(d.tel || '').replace(/\s/g, '')}`}><IcTel /> Référent</a></div>
          <div className="muted small mt-1.5">Référent : {d.auteur} · {d.tel || 'n° non renseigné'}</div></div>
        <div className="msec"><div className="k">Accès et clés</div>{d.acces || log.acces || '—'}<br />Clés : {d.numCles || ''} {(d.lieuCles || '').toLowerCase()}</div>
        <div className="msec"><div className="k">Travaux à réaliser · {lines.length} ligne{lines.length > 1 ? 's' : ''}</div>
          {lines.map(({ l, i }) => (
            <div key={i} className="row items-start flex-nowrap py-1.5 !gap-3"><Photo src={l.photos[0]} w={72} h={54} /><div><strong>{l.piece} · {l.nature}</strong><div className="s13">{l.description}</div><div className="muted small">Durée estimée {fdur(l.duree)}</div></div></div>
          ))}</div>
        <div className="msec"><div className="k">Consommables à emporter</div>
          {d.consommables.map((c, i) => (
            <label key={i} className="chkrow"><input type="checkbox" checked={c.pris} onChange={e => mutate(s => { const dm = getD(s, d.id); if (dm) dm.consommables[i].pris = e.target.checked })} /> {c.nom} × {c.qte}{c.origine !== 'Stock' && <> · <span className="text-warn">à acheter</span></>}</label>
          ))}
          {!d.consommables.length && <span className="muted s13">Aucun prévu</span>}</div>
        {r.etat === 'imp' && <div className="note warn">Accès impossible signalé ({r.motifImp}) · renvoyé à la coordination.</div>}
        {running && <div className="note warn">Une autre mission est en cours ({running.label}). Terminez-la avant d'en démarrer une nouvelle.</div>}
        {r.etat === 'planned' && !canStart && <div className="note">Mission prévue {fday(r.date)} : démarrage possible le jour même.</div>}
        {r.etat === 'planned' && (
          <>
            <button className="mbtn green" disabled={!(canStart && !running)} onClick={start}><IcPlay /> Démarrer la mission</button>
            <button className="mbtn ghost" onClick={imp}>Accès impossible</button>
            <p className="muted small m-0 text-center">« Accès impossible » demande un motif et une photo, puis renvoie à la coordination.</p>
          </>
        )}
        {r.etat === 'running' && <a className="mbtn green" href={`#/m/terminer/${r.id}`}>Reprendre la mission</a>}
      </div>
    </MobileShell>
  )
}
