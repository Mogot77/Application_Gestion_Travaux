import { useEffect, useRef, useState } from 'react'
import type { Demande, LigneStatut, Rdv, Work } from '../../types'
import { useApp } from '../../hooks/useApp'
import { go, replace } from '../../hooks/useRoute'
import { MobileShell } from './MobileShell'
import { AddPhoto, Photo } from '../ui/Photo'
import { IcFlag, IcPlus } from '../ui/Icons'
import { elapsed, ensureWork, stLines, useTick } from '../../lib/mobile'
import { getD, getLog, getOuv, getRdv, hist, nextId } from '../../lib/domain'
import { fdur, ftime, now, pad } from '../../lib/dates'
import { readPhotos } from '../../lib/photos'

const LS: [Exclude<LigneStatut, '' | 'planifiee'>, string][] = [['realisee', 'Réalisée'], ['partielle', 'Partielle'], ['non_realisee', 'Non réalisée']]
const LS_ON = { realisee: 'on-p', partielle: 'on-h', non_realisee: 'on-u' }

/** Zone de signature tactile ; renvoie l'image PNG à chaque trait. */
function SignaturePad({ initial, onChange }: { initial: string; onChange: (png: string) => void }) {
  const cv = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const cb = useRef(onChange)
  useEffect(() => { cb.current = onChange })

  useEffect(() => {
    const c = cv.current
    const ctx = c?.getContext('2d')
    if (!c || !ctx) return
    ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.strokeStyle = '#111827'
    if (initial) { const img = new Image(); img.onload = () => ctx.drawImage(img, 0, 0); img.src = initial }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const pt = (e: React.PointerEvent<HTMLCanvasElement>): [number, number] => {
    const c = e.currentTarget; const b = c.getBoundingClientRect()
    return [(e.clientX - b.left) * c.width / b.width, (e.clientY - b.top) * c.height / b.height]
  }
  const end = () => { if (!drawing.current || !cv.current) return; drawing.current = false; cb.current(cv.current.toDataURL('image/png')) }

  return (
    <canvas
      ref={cv} className="sig" width={600} height={220} aria-label="Zone de signature"
      onPointerDown={e => { drawing.current = true; e.currentTarget.setPointerCapture(e.pointerId); const [x, y] = pt(e); const ctx = e.currentTarget.getContext('2d'); ctx?.beginPath(); ctx?.moveTo(x, y) }}
      onPointerMove={e => { if (!drawing.current) return; const [x, y] = pt(e); const ctx = e.currentTarget.getContext('2d'); ctx?.lineTo(x, y); ctx?.stroke() }}
      onPointerUp={end} onPointerLeave={end}
    />
  )
}

/** Saisie de fin de mission : statut des lignes, photos « après », consommables, temps, signature. */
export function Terminer({ rid }: { rid: string }) {
  const { S, mutate, toast, openModal } = useApp()
  const [mcn, setMcn] = useState('')
  const [sigKey, setSigKey] = useState(0)
  useTick(10000)
  const r = getRdv(S, rid)
  const d = r?.demandeId ? getD(S, r.demandeId) : undefined
  const state = !r || !d ? 'missing' : r.etat === 'done' ? 'done' : r.etat !== 'running' ? 'other' : 'run'
  const needInit = state === 'run' && (!r?.work || !r?.debutReel)

  useEffect(() => {
    if (state === 'done') replace('#/m/rapport/' + rid)
    else if (state === 'other') replace('#/m/mission/' + rid)
  }, [state, rid])
  useEffect(() => {
    if (needInit) mutate(s => { const x = getRdv(s, rid); const dm = getD(s, x?.demandeId); if (x && dm) { if (!x.debutReel) x.debutReel = now(); ensureWork(x, dm) } })
  }, [needInit, rid, mutate])

  if (state === 'missing') return <MobileShell tab="missions"><div className="mbody"><div className="empty">Mission introuvable</div></div></MobileShell>
  if (!r || !d || state !== 'run' || !r.work) return <MobileShell tab="missions" />

  const w = r.work
  const log = getLog(S, d.logementId)
  const lines = stLines(d)
  const el = elapsed(r)

  const upW = (fn: (x: Work, rr: Rdv, dm: Demande) => void, persistNow = false) => mutate(s => {
    const x = getRdv(s, rid); const dm = getD(s, x?.demandeId)
    if (x && dm) fn(ensureWork(x, dm), x, dm)
  }, { now: persistNow })

  const corr = () => openModal({
    title: 'Corriger le temps passé', okLabel: 'Enregistrer',
    body: (
      <>
        <div><label className="lbl">Temps réel (minutes)</label><input className="in" type="number" min={5} step={5} name="m" defaultValue={w.corr ? w.corr.min : Math.max(elapsed(r), 5)} /></div>
        <div><label className="lbl">Motif (obligatoire)</label><input className="in" name="mo" placeholder="Oubli de démarrage, pause…" /></div>
      </>
    ),
    onOk(fd) {
      const mo = String(fd.get('mo') || '').trim()
      if (!mo) { toast('Motif obligatoire', 'err'); return false }
      const min = Number(fd.get('m')) || 5
      upW(x => { x.corr = { min, motif: mo } })
    },
  })

  const finish = () => {
    for (const { l, i } of lines) {
      const st = w.lignes[i]
      if (!st) return toast(`Indiquez le statut de « ${l.piece} · ${l.nature} »`, 'err')
      if (st === 'realisee' && !(w.apres[i] || []).length) return toast(`Photo « après » obligatoire : ${l.piece}`, 'err')
      if (st !== 'realisee' && !(w.motifs[i] || '').trim()) return toast(`Motif obligatoire : ${l.piece}`, 'err')
    }
    mutate(s => {
      const x = getRdv(s, rid); const dm = getD(s, x?.demandeId)
      if (!x || !dm || !x.work) return
      const ww = x.work; const o = getOuv(s, x.ouvrierId)
      const ls = stLines(dm)
      const tempsMin = ww.corr ? ww.corr.min : Math.max(elapsed(x), 1)
      const supps = ww.supps.map(sp => ({ ...sp, suiteLabel: (s.ref.suitesSupp.find(k => k.k === sp.suite) || { l: '' }).l }))
      x.etat = 'done'; x.finReel = now()
      x.rapport = { tempsMin, lignes: ls.map(({ i }) => ww.lignes[i]), motifs: ls.map(({ i }) => ww.motifs[i] || ''), conso: ww.conso, supps, obs: ww.obs, signature: ww.signature, signataire: ww.signataire, corr: ww.corr }
      ls.forEach(({ l, i }) => { l.statut = ww.lignes[i]; l.photosApres = (l.photosApres || []).concat(ww.apres[i] || []) })
      supps.forEach(sp => {
        const line = { piece: sp.piece, lot: sp.lot, nature: sp.nature, description: sp.description, photos: [sp.photo], imputation: 'Equalis', circuit: 'ST' as const, duree: sp.duree, urgence: 'prog' as const, statut: '' as LigneStatut, supp: true }
        if (sp.suite === 'realise') dm.lignes.push({ ...line, statut: 'realisee', photosApres: [sp.photo] })
        else {
          const nd: Demande = {
            id: nextId(s, 'di'), recueLe: now(), logementId: dm.logementId, origine: 'supp', auteur: o?.nom || '', fonction: "Chef d'équipe / ouvrier", tel: '', urgence: 'prog', dateSouhaitee: '',
            acces: dm.acces, numCles: dm.numCles, lieuCles: dm.lieuCles, facturation: 'Non', sinistre: 'Non', sinistreInfo: null, observations: '', message: '', consommables: [], historique: [],
            lignes: [line], statut: sp.suite === 'programmer' ? 'a_planifier' : 'en_qualification', ft: '', parentId: dm.id,
          }
          if (sp.suite === 'programmer') nd.ft = nextId(s, 'ft')
          hist(nd, `Ajout sur place signalé par ${o?.nom} lors de ${dm.id}${sp.suite === 'validation' ? ' · validation de la coordination demandée' : ' · à programmer'}`)
          s.demandes.unshift(nd)
        }
      })
      const all = dm.lignes.filter(l => l.circuit === 'ST' || !l.circuit).every(l => l.statut === 'realisee')
      const otherPlanned = s.rdvs.some(k => k.demandeId === dm.id && k.etat === 'planned')
      dm.statut = all ? 'realisee' : otherPlanned ? 'planifiee' : 'a_planifier'
      hist(dm, `Mission terminée par ${o?.nom} · ${fdur(tempsMin)} · rapport envoyé à la coordination (complet) et à l'établissement (sans coûts)`)
      if (!all && !otherPlanned) hist(dm, 'Travaux restants : à replanifier')
      if (supps.length) hist(dm, `${supps.length} travaux supplémentaire(s) signalé(s) sur place`)
    }, { now: true })
    go('#/m/rapport/' + rid)
  }

  return (
    <MobileShell tab="missions">
      <div className="mhead"><div className="s">{d.id} · {log?.ville}{log?.apt ? ', apt ' + log.apt : ''}</div><h1>Mission en cours</h1>
        <div className="row mt-2 items-baseline !gap-2.5"><span className="timer">{pad(Math.floor(el / 60))}:{pad(el % 60)}</span><span className="s">démarrée à {ftime(r.debutReel)}</span></div></div>
      <div className="mbody">
        {lines.map(({ l, i }, n) => {
          const st = w.lignes[i] || ''; const ap = w.apres[i] || []
          return (
            <div key={i} className="msec"><div className="k">Ligne {n + 1} · {l.piece} — {l.nature}</div>
              <div className="seg">{LS.map(([k, lb]) => <button key={k} type="button" className={st === k ? LS_ON[k] : ''} onClick={() => upW(x => { x.lignes[i] = k })}>{lb}</button>)}</div>
              {st && st !== 'realisee' && <input className="in sm mt-2" value={w.motifs[i] || ''} placeholder="Motif (obligatoire) : pièce manquante, temps…" onChange={e => upW(x => { x.motifs[i] = e.target.value })} />}
              <div className="row mt-2.5 flex-nowrap !gap-2">
                <div className="text-center"><Photo src={l.photos[0]} w={92} h={70} /><div className="small muted">AVANT</div></div>
                {ap.map((p, j) => <div key={j} className="text-center"><Photo src={p} w={92} h={70} onDelete={() => upW(x => { x.apres[i].splice(j, 1) })} /><div className="small muted">APRÈS</div></div>)}
                <AddPhoto label={ap.length ? '+' : 'Photo après'} w={ap.length ? 50 : 92} h={70} req={st === 'realisee' && !ap.length}
                  onFiles={f => readPhotos(f).then(ph => upW(x => { x.apres[i] = (x.apres[i] || []).concat(ph) }, true))} />
              </div>
              {st === 'realisee' && !ap.length && <p className="small mb-0 mt-1.5 text-warn">Photo « après » obligatoire pour une ligne réalisée.</p>}
            </div>
          )
        })}
        <div className="msec"><div className="k">Consommables utilisés</div>
          {w.conso.map((c, i) => (
            <div key={i} className="cnt"><span>{c.nom}</span><span className="st">
              <button aria-label="Moins" onClick={() => upW(x => { x.conso[i].qte -= 1; if (x.conso[i].qte <= 0) x.conso.splice(i, 1) })}>−</button><strong>{c.qte}</strong>
              <button aria-label="Plus" onClick={() => upW(x => { x.conso[i].qte += 1 })}>+</button></span></div>
          ))}
          {!w.conso.length && <div className="muted s13">Aucun</div>}
          <div className="row mt-2 flex-nowrap !gap-1.5"><input className="in sm" placeholder="+ Ajouter un consommable" value={mcn} onChange={e => setMcn(e.target.value)} />
            <button className="btn btn-sm" onClick={() => { const v = mcn.trim(); if (!v) return; upW(x => { x.conso.push({ nom: v, qte: 1 }) }); setMcn('') }}>Ajouter</button></div></div>
        <a className="mc flex items-center gap-3" href={`#/m/supplement/${r.id}`}><IcPlus c="#1D4ED8" /><div><strong>Travaux supplémentaires</strong><div className="muted">{w.supps.length ? `${w.supps.length} ajouté${w.supps.length > 1 ? 's' : ''} · ${w.supps.map(sp => sp.piece + ', ' + sp.nature.toLowerCase()).join(' ; ')}` : 'Signaler un problème constaté sur place'}</div></div></a>
        <div className="msec"><div className="k">Temps passé</div><div className="row between"><span className="muted s13">{w.corr ? 'Corrigé : ' + w.corr.motif : 'Calculé au clic sur « Terminer »'}</span><strong className="text-lg">≈ {fdur(w.corr ? w.corr.min : Math.max(el, 1))}</strong></div>
          <button className="linkbtn small mt-1.5" onClick={corr}>Corriger (motif obligatoire)</button></div>
        <div className="msec"><div className="k">Observations</div><textarea className="in" value={w.obs} placeholder="À surveiller, à prévoir…" onChange={e => upW(x => { x.obs = e.target.value })} /></div>
        <div className="msec"><div className="k">Signature (facultative)</div>
          <SignaturePad key={sigKey} initial={w.signature} onChange={png => upW(x => { x.signature = png })} />
          <div className="row between mt-2 flex-nowrap !gap-2"><input className="in sm" value={w.signataire} placeholder="Nom : occupant ou référent" onChange={e => upW(x => { x.signataire = e.target.value })} />
            <button className="btn btn-sm" onClick={() => { upW(x => { x.signature = '' }); setSigKey(k => k + 1) }}>Effacer</button></div></div>
        <button className="mbtn" onClick={finish}><IcFlag /> Terminer la mission</button>
        <p className="muted small mb-2 mt-0 text-center">Génère le rapport et l'envoie à la coordination et au demandeur.</p>
      </div>
    </MobileShell>
  )
}
