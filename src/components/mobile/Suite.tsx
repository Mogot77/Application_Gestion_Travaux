import { useEffect } from 'react'
import type { SuiteSupp } from '../../types'
import { useApp } from '../../hooks/useApp'
import { go, useRoute } from '../../hooks/useRoute'
import { setUi as resetUiKey, useUiState } from '../../store/ui'
import { BackHead, MobileShell } from './MobileShell'
import { Chip } from '../ui/Chip'
import { Opts, Seg } from '../ui/Fields'
import { AddPhoto, Photo } from '../ui/Photo'
import { IcCam, IcCheck, IcChev } from '../ui/Icons'
import { ensureWork, meOf, stLines } from '../../lib/mobile'
import { DEPTS } from '../../data/refs'
import { getD, getLog, getRdv, nextId, ouvActifs, piecesFor, rdvsOf } from '../../lib/domain'
import { logFolder } from '../../lib/docs'
import { TODAY, fdur, ftime, slug, weekStart } from '../../lib/dates'
import { readPhotos } from '../../lib/photos'

/* =====================================================================
   M4 · Travaux supplémentaires
   ===================================================================== */
interface SuppUi { rid: string; photo: string; piece: string; lot: string; nature: string; description: string; duree: number; suite: SuiteSupp | '' }
const SUPP_KEY = 'supp'
const SUPP_INIT: SuppUi = { rid: '', photo: '', piece: '', lot: '', nature: '', description: '', duree: 30, suite: '' }

export function Supplement({ rid }: { rid: string }) {
  const { S, mutate, toast } = useApp()
  const [stored, patch] = useUiState<SuppUi>(SUPP_KEY, SUPP_INIT)
  const r = getRdv(S, rid)
  const d = r?.demandeId ? getD(S, r.demandeId) : undefined
  const ok = !!r && !!d && r.etat === 'running'
  const s: SuppUi = stored.rid === rid ? stored : { ...SUPP_INIT, rid, lot: d?.lignes[0]?.lot || '' }
  const set = (p: Partial<SuppUi>) => patch({ ...s, ...p })

  useEffect(() => {
    if (ok && stored.rid !== rid) patch({ ...SUPP_INIT, rid, lot: d?.lignes[0]?.lot || '' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ok, rid, stored.rid])

  if (!ok || !r || !d) return <MobileShell tab="signaler"><div className="mbody"><div className="empty">Aucune mission en cours. <a href="#/m/missions">Mes missions</a></div></div></MobileShell>

  const pp = piecesFor(S, getLog(S, d.logementId))
  const max = S.ref.seuils.supplementMin
  const add = () => {
    if (!s.photo) return toast('Photo obligatoire', 'err')
    if (!s.piece || !s.nature) return toast('Pièce et nature obligatoires', 'err')
    if (!s.suite) return toast('Choisissez la suite donnée', 'err')
    const suite = s.suite
    mutate(st => {
      const x = getRdv(st, rid); const dm = getD(st, x?.demandeId)
      if (x && dm) ensureWork(x, dm).supps.push({ photo: s.photo, piece: s.piece, lot: s.lot, nature: s.nature, description: s.description, duree: s.duree, suite })
    }, { now: true })
    resetUiKey(SUPP_KEY, null)
    toast('Ajouté à la mission', 'ok')
    go('#/m/terminer/' + rid)
  }

  return (
    <MobileShell tab="signaler">
      <BackHead href={'#/m/terminer/' + rid} title="Travaux supplémentaires" sub={`Rattaché à ${d.id}`} />
      <div className="mbody">
        <div className="msec"><div className="k">Photo justificative (obligatoire)</div>
          {s.photo ? <Photo src={s.photo} w={326} h={200} onDelete={() => set({ photo: '' })} />
            : <AddPhoto label={<><IcCam c="#B54708" s={24} /> Prendre la photo</>} w="100%" h={120} req multiple={false} onFiles={f => readPhotos(f).then(ph => { if (ph[0]) set({ photo: ph[0] }) })} />}</div>
        <div className="msec stack" style={{ '--gap': '12px' } as React.CSSProperties}>
          <div><label className="lbl" htmlFor="sp">Pièce</label><select className="in" id="sp" value={s.piece} onChange={e => set({ piece: e.target.value })}><Opts list={pp.pieces.concat(pp.autres)} placeholder="Choisir…" /></select></div>
          <div><label className="lbl" htmlFor="sl">Lot</label><select className="in" id="sl" value={s.lot} onChange={e => set({ lot: e.target.value, nature: '' })}><Opts list={Object.keys(S.ref.lots)} /></select></div>
          <div><label className="lbl" htmlFor="sn">Nature</label><select className="in" id="sn" value={s.nature} onChange={e => set({ nature: e.target.value })}><Opts list={S.ref.lots[s.lot] || []} placeholder="Choisir…" /></select></div>
          <div><label className="lbl" htmlFor="sd">Description</label><textarea className="in" id="sd" value={s.description} placeholder="Ce qui est constaté" onChange={e => set({ description: e.target.value })} /></div>
          <div><span className="lbl">Temps estimé</span><div className="stepper">
            <button aria-label="Moins 15 minutes" onClick={() => { const duree = Math.max(15, s.duree - 15); set({ duree, ...(s.suite === 'realise' && duree > max ? { suite: '' as const } : {}) }) }}>−</button><strong>{fdur(s.duree)}</strong>
            <button aria-label="Plus 15 minutes" onClick={() => { const duree = s.duree + 15; set({ duree, ...(s.suite === 'realise' && duree > max ? { suite: '' as const } : {}) }) }}>+</button></div></div>
        </div>
        <div className="msec"><div className="k">Suite donnée</div><div className="stack" style={{ '--gap': '8px' } as React.CSSProperties}>
          {S.ref.suitesSupp.map(x => {
            const dis = x.k === 'realise' && s.duree > max
            return (
              <label key={x.k} className={`radio${s.suite === x.k ? ' on' : ''}${dis ? ' opacity-45' : ''}`}>
                <input type="radio" name="suite" value={x.k} checked={s.suite === x.k} disabled={dis} onChange={() => set({ suite: x.k })} />
                <div><strong>{x.l}</strong><div className="muted">{x.k === 'realise' ? `Jusqu'à ${fdur(max)} sans validation` : x.d}</div></div>
              </label>
            )
          })}
        </div></div>
        <button className="mbtn" onClick={add}>Ajouter à la mission</button>
      </div>
    </MobileShell>
  )
}

/* =====================================================================
   M5 · Rapport automatique
   ===================================================================== */
export function RapportMobile({ rid }: { rid: string }) {
  const { S } = useApp()
  const r = getRdv(S, rid)
  const d = r?.demandeId ? getD(S, r.demandeId) : undefined
  if (!r || !d || !r.rapport) return <MobileShell tab="missions"><div className="mbody"><div className="empty">Rapport indisponible. <a href="#/m/missions">Mes missions</a></div></div></MobileShell>
  const rp = r.rapport; const log = getLog(S, d.logementId)
  const lines = stLines(d)
  const nxt = rdvsOf(S, r.ouvrierId, r.date).find(x => x.etat === 'planned' && x.demandeId)
  const all = rp.lignes.every(x => x === 'realisee')
  const l0 = lines[0]?.l
  const LABEL = { realisee: 'Réalisée', partielle: 'Partielle', non_realisee: 'Non réalisée', planifiee: '', '': '' }
  return (
    <MobileShell tab="missions">
      <div className="ok-hero"><div className="ic"><IcCheck /></div><h1 className="text-xl">Mission terminée</h1><div className="muted s13">Rapport généré et envoyé à {ftime(r.finReel)}</div></div>
      <div className="mbody">
        <div className="msec"><div className="row between mb-2.5"><strong>Rapport {d.id}</strong><Chip tone={all ? 'ok' : 'h48'}>{all ? 'Réalisée' : 'Partielle'}</Chip></div>
          {l0 && (
            <>
              <div className="k">Avant / après · {l0.piece}</div>
              <div className="row flex-nowrap !gap-2"><Photo src={l0.photos[0]} w={150} h={110} /><Photo src={(l0.photosApres || []).slice(-1)[0]} w={150} h={110} /></div>
            </>
          )}
          <div className="mt-3">
            {lines.map(({ l }, n) => <div key={n} className="cnt"><span>{l.nature}</span><strong>{LABEL[rp.lignes[n]]}</strong></div>)}
            {rp.supps.map((sp, i) => <div key={i} className="cnt"><span>{sp.piece} · {sp.nature.toLowerCase()} (ajout)</span><strong>{sp.suite === 'realise' ? 'Réalisée' : sp.suite === 'programmer' ? 'À programmer' : 'À valider'}</strong></div>)}
            <div className="cnt"><span>Temps passé</span><strong>{fdur(rp.tempsMin)}</strong></div>
            <div className="cnt"><span>Consommables</span><strong>{rp.conso.reduce((s, c) => s + c.qte, 0)} article{rp.conso.length > 1 ? 's' : ''}</strong></div>
            <div className="cnt"><span>Signature</span><strong>{rp.signature || rp.signataire ? rp.signataire || 'Oui' : '—'}</strong></div>
          </div></div>
        <div className="msec s13"><div className="k">Envoyé à</div>Coordination ST · version complète avec coûts<br />{log?.etab} · version sans coûts</div>
        {log && <div className="msec s13"><div className="k">Classé dans</div><code className="whitespace-normal break-all">{DEPTS[log.dept]} / {slug(log.ville)} / {logFolder(log)} / {d.id}_{d.recueLe.slice(0, 10)}</code></div>}
        <a className="mbtn sec" href={`#/fiche/${d.id}`}>Voir le rapport PDF</a>
        {nxt ? <a className="mbtn" href={`#/m/mission/${nxt.id}`}>Mission suivante · {nxt.debut}</a> : <a className="mbtn" href="#/m/missions">Retour à mes missions</a>}
      </div>
    </MobileShell>
  )
}

/* =====================================================================
   M6 · Constat d'état (tout salarié)
   ===================================================================== */
interface ConstatUi { logementId: string; contexte: string; proprete: number | null; bati: string; signalements: string[]; photos: string[]; commentaire: string; open: boolean }
const MC_KEY = 'mc'
const MC_INIT: ConstatUi = { logementId: '', contexte: '', proprete: null, bati: '', signalements: [], photos: [], commentaire: '', open: false }

export function ConstatMobile() {
  const { S, mutate, toast } = useApp()
  const { query: q } = useRoute()
  const [c, patch] = useUiState<ConstatUi>(MC_KEY, MC_INIT)
  const needReset = !!q.log && c.logementId !== q.log
  useEffect(() => {
    if (needReset) patch({ ...MC_INIT, logementId: q.log })
  }, [needReset, q.log, patch])

  const me = meOf(S)
  const contexte = c.contexte || S.ref.contextes[0]
  const n = c.signalements.length

  const save = (andCreate: boolean) => {
    if (!c.logementId) return toast('Choisissez le logement', 'err')
    if (c.proprete == null) return toast('Note de propreté obligatoire', 'err')
    if (!c.bati) return toast("État du bâti obligatoire", 'err')
    const danger = c.signalements.some(s => /Chauffage d'appoint|électrique dangereuse/.test(s))
    const low = c.proprete <= 2
    const proprete = c.proprete
    let ceId = ''
    mutate(s => {
      const id = nextId(s, 'ce'); ceId = id
      s.constats.unshift({ id, date: TODAY, logementId: c.logementId, auteur: me.nom, fonction: 'Ouvrier', contexte, proprete, bati: c.bati, signalements: c.signalements.slice(), photos: c.photos.slice(), commentaire: c.commentaire, suite: danger || low ? 'alerte' : '' })
    }, { now: true })
    resetUiKey(MC_KEY, null)
    toast(`Constat ${ceId} enregistré${danger ? ' · alerte sécurité envoyée à la coordination' : low ? ' · coordination alertée' : ''}`, danger || low ? 'err' : 'ok')
    if (c.signalements.some(s => / HS$/.test(s)) && !andCreate) window.setTimeout(() => toast("Équipement hors service : pensez à créer une demande d'intervention"), 600)
    go(andCreate ? `#/demande/new?log=${c.logementId}&constat=${ceId}` : '#/constats')
  }

  return (
    <MobileShell tab="constat">
      <div className="mhead"><div className="s">Ouvert à tout salarié</div><h1>Constat d'état</h1></div>
      <div className="mbody">
        <div className="msec stack" style={{ '--gap': '12px' } as React.CSSProperties}>
          <div><label className="lbl" htmlFor="cl">Logement</label><select className="in" id="cl" value={c.logementId} onChange={e => patch({ logementId: e.target.value })}>
            <Opts placeholder="Choisir…" list={S.logements.filter(l => l.typo !== 'BUR').map(l => ({ v: l.id, l: `${l.id} · ${l.typo} · ${l.ville}` }))} /></select></div>
          <div><label className="lbl" htmlFor="cc">Contexte de la visite</label><select className="in" id="cc" value={contexte} onChange={e => patch({ contexte: e.target.value })}><Opts list={S.ref.contextes} /></select></div>
        </div>
        <div className="msec"><div className="k">Propreté · note de 0 à 6</div>
          <div className="pnote" role="group" aria-label="Note de propreté">{[0, 1, 2, 3, 4, 5, 6].map(i => <button key={i} type="button" className={c.proprete === i ? 'on' + (i <= 2 ? ' low' : '') : ''} onClick={() => patch({ proprete: i })}>{i}</button>)}</div>
          <div className="row between small muted mt-1.5"><span>0 insalubre</span><strong className="text-ink">{c.proprete == null ? '—' : c.proprete + ' · ' + S.ref.proprete[c.proprete].toLowerCase()}</strong><span>6 impeccable</span></div>
          {c.proprete != null && c.proprete <= 2 && <p className="small mb-0 mt-1.5 text-danger">Note ≤ 2 : la coordination sera alertée.</p>}</div>
        <div className="msec"><div className="k">État général du bâti</div><Seg values={['Bon', 'Moyen', 'Dégradé']} sel={c.bati} onPick={v => patch({ bati: v })} /></div>
        <div className="msec"><div className="k">Signalements</div>
          <button className="in" aria-expanded={c.open} onClick={() => patch({ open: !c.open })}>{n ? `${n} sélectionné${n > 1 ? 's' : ''}` : 'Aucun signalement'}<IcChev /></button>
          {c.open ? Object.entries(S.ref.signalements).map(([g, arr]) => (
            <div key={g}><div className="small muted mb-0.5 mt-3 font-bold tracking-[.04em]">{g.toUpperCase()}</div>
              {arr.map(sg => <label key={sg} className="chkrow"><input type="checkbox" checked={c.signalements.includes(sg)} onChange={e => patch({ signalements: e.target.checked ? [...c.signalements, sg] : c.signalements.filter(x => x !== sg) })} /> {sg}</label>)}</div>
          )) : (n > 0 && <div className="mt-2">{c.signalements.map(sg => <span key={sg} className="tag">{sg}</span>)}</div>)}
        </div>
        <div className="msec"><div className="k">Photos ({c.photos.length})</div>
          <div className="row !gap-2">{c.photos.map((ph, j) => <Photo key={j} src={ph} w={72} h={72} onDelete={() => patch({ photos: c.photos.filter((_x, k) => k !== j) })} />)}
            <AddPhoto label="+" w={72} h={72} onFiles={f => readPhotos(f).then(ph => patch({ photos: [...c.photos, ...ph] }))} /></div></div>
        <div className="msec"><div className="k">Commentaire</div><textarea className="in" value={c.commentaire} placeholder="Décrire le logement" onChange={e => patch({ commentaire: e.target.value })} />
          <p className="muted small mb-0 mt-1.5">Décrire le logement, jamais le ménage. Pas de personne sur les photos.</p></div>
        <button className="mbtn" onClick={() => save(false)}>Enregistrer le constat</button>
        <button className="mbtn sec" onClick={() => save(true)}>Enregistrer et créer une demande</button>
      </div>
    </MobileShell>
  )
}

/* =====================================================================
   Profil
   ===================================================================== */
export function ProfilMobile() {
  const { S, mutate } = useApp()
  const o = meOf(S)
  const done = S.rdvs.filter(r => r.ouvrierId === o.id && r.etat === 'done' && weekStart(r.date) === weekStart(TODAY))
  const actifs = ouvActifs(S)
  return (
    <MobileShell tab="profil">
      <div className="mhead"><div className="s">Profil</div><h1>{o.nom}</h1></div>
      <div className="mbody">
        <div className="msec"><div className="k">Connecté en tant que (démonstration)</div>
          <select className="in" value={o.id} onChange={e => mutate(s => { s.mobile.ouvrierId = e.target.value }, { now: true })}>
            <Opts list={actifs.map(x => ({ v: x.id, l: `${x.nom} — ${x.metier}` }))} placeholder={actifs.length ? undefined : 'Aucun ouvrier actif'} />
          </select></div>
        <div className="msec"><div className="k">Cette semaine</div>
          <div className="cnt"><span>Missions réalisées</span><strong>{done.length}</strong></div>
          <div className="cnt"><span>Temps passé</span><strong>{fdur(done.reduce((s, r) => s + (r.rapport ? r.rapport.tempsMin : r.duree), 0))}</strong></div></div>
        <div className="msec s13 muted">Les missions planifiées arrivent dans votre agenda Outlook et ici. Saisissez heures, consommables et photos « après » sous 48 h.</div>
        <a className="mbtn sec" href="#/planning">Ouvrir l'interface bureau</a>
      </div>
    </MobileShell>
  )
}
