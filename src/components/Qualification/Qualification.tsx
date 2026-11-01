import { useEffect, type ReactNode } from 'react'
import type { Demande, Ligne } from '@/types'
import { useApp } from '@/hooks/useApp'
import { go } from '@/hooks/useRoute'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Chip from '@/components/ui/Chip'
import Field from '@/components/ui/Field'
import Note from '@/components/ui/Note'
import StatusChip from '@/components/StatusChip'
import UrgencyChip from '@/components/UrgencyChip'
import Kv from '@/components/ui/Kv'
import Opts from '@/components/ui/Opts'
import AddPhoto from '@/components/ui/AddPhoto'
import Photo from '@/components/Photo'
import {
  CLOSED, QUALIF, RDV_ETAT, ageOf, circuitLabel, dureeST, getD, getLog, getOuv, hist, lineLabel, logAdr, nextId, nextRdv,
} from '@/helpers/domain'
import { TODAY, addDays, diffDays, fd, fday, fdt, fdur, ftime, now } from '@/helpers/dates'
import { readPhotos } from '@/helpers/photos'
import type { QualificationProps } from './types'

const Qualification = ({ id }: QualificationProps) => {
  const { S, mutate, toast, openModal } = useApp()
  const d = getD(S, id)
  const isEtab = S.profil === 'etab'

  // Prise en charge automatique par la coordination à l'ouverture
  const takeOver = !!d && d.statut === 'a_qualifier' && !isEtab
  useEffect(() => {
    if (takeOver) mutate(s => { const x = getD(s, id); if (x) { x.statut = 'en_qualification'; hist(x, 'Prise en charge par la coordination') } })
  }, [takeOver, id, mutate])

  if (!d) return <Layout active="demandes"><Card pad="md" className="empty">Demande {id} introuvable. <a href="#/demandes">Retour aux demandes</a></Card></Layout>

  const log = getLog(S, d.logementId)
  const edit = QUALIF.includes(d.statut) && !isEtab
  const totalST = d.lignes.filter(l => l.circuit === 'ST').reduce((s, l) => s + l.duree, 0)
  const rdvs = S.rdvs.filter(r => r.demandeId === d.id).sort((a, b) => (a.date + a.debut).localeCompare(b.date + b.debut))
  const lastC = S.constats.filter(c => c.logementId === log?.id).sort((a, b) => b.date.localeCompare(a.date))[0]
  const autres = S.demandes.filter(x => x.logementId === log?.id && x.id !== d.id)
  const ouvertes = autres.filter(x => !CLOSED.includes(x.statut))
  const n12 = autres.filter(x => diffDays(x.recueLe, TODAY) <= 365).length
  const rapports = rdvs.filter(r => r.rapport)
  const age = ageOf(d)

  /** Modifie la demande courante (copie de l'état) puis persiste. */
  const upd = (fn: (x: Demande) => void, persistNow = false) => mutate(s => { const x = getD(s, id); if (x) fn(x) }, { now: persistNow })
  const simple = (fn: (x: Demande) => void, msg?: string, kind: 'ok' | '' = '') => { upd(fn, true); if (msg) toast(msg, kind) }

  const valider = () => {
    if (d.lignes.some(l => !l.circuit)) return toast('Choisissez un circuit pour chaque ligne', 'err')
    let dest = ''
    let msg = ''
    mutate(s => {
      const x = getD(s, id)
      if (!x) return
      x.lignes.forEach(l => { if (!l.urgence) l.urgence = x.urgence })
      if (x.message && x.message.trim()) hist(x, `Message à l'établissement : « ${x.message.trim()} »`)
      const cs = new Set(x.lignes.map(l => l.circuit))
      if (cs.has('ST')) {
        x.ft = x.ft || nextId(s, 'ft'); x.statut = 'a_planifier'
        hist(x, `Qualifiée · ${x.ft} · à planifier (${fdur(dureeST(x))})`)
        if (cs.size > 1) hist(x, `Autres lignes : ${[...cs].filter(c => c !== 'ST').map(c => circuitLabel(s, c)).join(', ')}`)
        dest = '#/planning?sel=' + x.id; msg = `${x.id} qualifiée · à planifier`
      } else if (cs.has('prestataire')) {
        x.statut = 'prestataire'; hist(x, 'Qualifiée · circuit prestataire')
        dest = '#/consultation/' + x.id; msg = 'Circuit prestataire : lancez la consultation'
      } else if (cs.has('sinistre')) {
        x.statut = 'sinistre'; hist(x, 'Qualifiée · sinistre / assurance : déclaration à faire')
      } else {
        x.statut = 'bailleur'; hist(x, `Demande transmise au bailleur (${getLog(s, x.logementId)?.bailleur})`)
        msg = 'Demande transmise au bailleur'
      }
    }, { now: true })
    if (msg) toast(msg, 'ok')
    if (dest) go(dest)
  }

  const renvoyer = () => openModal({
    title: `Renvoyer ${d.id} à l'établissement`, okLabel: 'Renvoyer',
    body: (
      <>
        <Field label="Motif (obligatoire)"><select className="in" name="motif"><Opts list={S.ref.motifsRenvoi} /></select></Field>
        <Field label="Message au demandeur"><textarea className="in" name="msg" placeholder="Précisez ce qui manque" /></Field>
      </>
    ),
    onOk(fd) {
      simple(x => { x.statut = 'a_completer'; x.motifRenvoi = String(fd.get('motif')); x.msgRenvoi = String(fd.get('msg')); hist(x, `Renvoyée à l'établissement : ${x.motifRenvoi}`) }, 'Demande renvoyée · le demandeur est notifié')
    },
  })
  const rejeter = () => openModal({
    title: `Rejeter ${d.id}`, okLabel: 'Rejeter la demande', danger: true,
    body: (
      <>
        <Field label="Motif de rejet (obligatoire)"><select className="in" name="motif"><Opts list={S.ref.motifsRejet} /></select></Field>
        <Field label="Commentaire"><textarea className="in" name="msg" /></Field>
      </>
    ),
    onOk(fd) {
      simple(x => { x.statut = 'rejetee'; x.motifRejet = String(fd.get('motif')) + (fd.get('msg') ? ' — ' + String(fd.get('msg')) : ''); hist(x, `Rejetée : ${x.motifRejet}`) }, 'Demande rejetée')
    },
  })

  const completee = () => simple(x => { x.statut = 'a_qualifier'; hist(x, "Complétée par l'établissement") }, 'Demande renvoyée en qualification', 'ok')
  const reactualisee = () => simple(x => { x.statut = 'a_qualifier'; x.recueLe = now(); hist(x, 'Réactualisée par le demandeur : besoin confirmé') }, 'Demande réactualisée', 'ok')
  const relancer = () => simple(x => hist(x, 'Relance envoyée au demandeur pour réactualisation'), 'Relance envoyée')
  const cloturer = () => simple(x => { x.statut = 'cloturee'; hist(x, 'Réceptionnée et clôturée par la coordination') }, `${d.id} clôturée`, 'ok')
  const bailleurFait = () => simple(x => { x.statut = 'cloturee'; x.dateIntervention = TODAY; hist(x, 'Travaux réalisés par le bailleur · clôturée') })
  const relancerBailleur = () => simple(x => hist(x, 'Relance envoyée au bailleur'), 'Relance envoyée au bailleur')
  const presteFait = () => simple(x => { x.statut = 'realisee'; x.dateIntervention = x.dateIntervention || TODAY; x.lignes.forEach(l => { l.statut = 'realisee' }); hist(x, 'Intervention du prestataire réalisée · à réceptionner') })
  const declaration = () => simple(x => hist(x, "Déclaration de sinistre envoyée à l'assureur"), 'Déclaration enregistrée')
  const sinistreTravaux = () => {
    mutate(s => { const x = getD(s, id); if (!x) return; x.lignes.forEach(l => { l.circuit = 'ST' }); x.ft = x.ft || nextId(s, 'ft'); x.statut = 'a_planifier'; hist(x, 'Indemnisation actée · travaux confiés au service technique') }, { now: true })
    go('#/planning?sel=' + id)
  }

  const bar = (): ReactNode => {
    if (isEtab) {
      if (d.statut === 'a_completer') return <button className="btn btnp" onClick={completee}>J'ai complété la demande</button>
      if (d.statut === 'a_reactualiser') return <button className="btn btnp" onClick={reactualisee}>Confirmer : le besoin est toujours d'actualité</button>
      return d.ft ? <a className="btn" href={`#/fiche/${d.id}`}>Fiche imprimable</a> : null
    }
    const B: ReactNode[] = []
    const add = (k: string, n: ReactNode) => B.push(<span key={k} className="contents">{n}</span>)
    if (QUALIF.includes(d.statut)) {
      add('consult', <a className="btn" href={d.consultationId ? `#/devis/${d.consultationId}` : `#/consultation/${d.id}`}>Consulter des entreprises</a>)
      add('renv', <button className="btn" onClick={renvoyer}>Renvoyer à l'établissement</button>)
      add('rej', <button className="btn btnd" onClick={rejeter}>Rejeter</button>)
      add('val', <button className="btn btnp" onClick={valider}>{d.statut === 'a_valider_occupant' ? 'Valider la demande occupant' : 'Valider et planifier'}</button>)
    }
    if (d.statut === 'a_completer') { add('comp', <button className="btn" onClick={completee}>Marquer comme complétée</button>); add('rej2', <button className="btn btnd" onClick={rejeter}>Rejeter</button>) }
    if (d.statut === 'a_reactualiser') { add('rel', <button className="btn" onClick={relancer}>Relancer le demandeur</button>); add('rea', <button className="btn" onClick={reactualisee}>Réactualisée</button>); add('rej3', <button className="btn btnd" onClick={rejeter}>Rejeter</button>) }
    if (['a_planifier', 'acces_impossible'].includes(d.statut)) {
      add('f1', <a className="btn" href={`#/fiche/${d.id}`}>Fiche imprimable</a>)
      add('p1', <a className="btn btnp" href={`#/planning?sel=${d.id}`}>{d.statut === 'acces_impossible' ? 'Reprogrammer' : 'Planifier'}</a>)
    }
    if (['planifiee', 'en_cours'].includes(d.statut)) {
      add('f2', <a className="btn" href={`#/fiche/${d.id}`}>Fiche imprimable</a>)
      add('p2', <a className="btn" href={`#/planning?sel=${d.id}&w=${nextRdv(S, d)?.date || ''}`}>Voir au planning</a>)
    }
    if (d.statut === 'realisee') { add('r1', <a className="btn" href={`#/fiche/${d.id}`}>Rapport</a>); add('r2', <button className="btn btnp" onClick={cloturer}>Réceptionner et clôturer</button>) }
    if (d.statut === 'prestataire' && !d.consultationId) B.unshift(<span key="c0" className="contents"><a className="btn" href={`#/consultation/${d.id}`}>Consulter des entreprises</a></span>)
    if (d.statut === 'consultation' || (d.statut === 'prestataire' && d.consultationId)) add('dv', <a className="btn btnp" href={`#/devis/${d.consultationId}`}>Devis et décision</a>)
    if (d.statut === 'prestataire') add('pf', <button className="btn btnp" onClick={presteFait}>Intervention du prestataire réalisée</button>)
    if (d.statut === 'bailleur') { add('b1', <button className="btn" onClick={relancerBailleur}>Relancer le bailleur</button>); add('b2', <button className="btn btnp" onClick={bailleurFait}>Travaux faits par le bailleur</button>) }
    if (d.statut === 'sinistre') { add('s1', <button className="btn" onClick={declaration}>Déclaration envoyée à l'assureur</button>); add('s2', <button className="btn btnp" onClick={sinistreTravaux}>Passer en travaux ST</button>) }
    if (d.statut === 'cloturee') add('cl', <a className="btn" href={`#/fiche/${d.id}`}>Rapport</a>)
    return B
  }

  const setLine = (i: number, k: 'imputation' | 'circuit' | 'urgence', v: string) => upd(x => {
    const l = x.lignes[i] as unknown as Record<string, string>
    l[k] = v
    if (k === 'circuit' && v === 'bailleur') x.lignes[i].imputation = 'Bailleur propriétaire'
  })
  const addPhotos = (i: number, files: FileList) => readPhotos(files).then(ph => upd(x => { x.lignes[i].photos.push(...ph); hist(x, `${ph.length} photo(s) ajoutée(s) à la ligne ${i + 1}`) }, true))

  const lineQualif = (l: Ligne, i: number) => {
    const circ = S.ref.circuits.find(c => c.k === l.circuit)
    return (
      <div key={i} className="line !p-3.5">
        <div className={`row between flex-nowrap items-start ${edit ? 'mb-3' : ''}`}>
          <div>
            <strong className="s13">{i + 1} · {lineLabel(l)}</strong>
            <p className="muted s13 mb-0 mt-1">{l.description}</p>
            {l.extra && Object.keys(l.extra).length > 0 && (
              <p className="small muted mb-0 mt-1">{Object.entries(l.extra).filter(([, v]) => v).map(([k, v]) => `${k} : ${v}`).join(' · ')}</p>
            )}
            {!edit && (
              <div className="row mt-2 !gap-1.5">
                {l.circuit && <Chip>{circuitLabel(S, l.circuit)}</Chip>}
                {l.imputation && <Chip tone={l.imputation.startsWith('Usager') ? 'h48' : 'gr'}>{l.imputation}</Chip>}
                {l.circuit === 'ST' && <Chip>{fdur(l.duree)}</Chip>}
                {l.statut === 'realisee' ? <Chip tone="ok">Réalisée</Chip> : l.statut === 'partielle' ? <Chip tone="h48">Partielle</Chip> : l.statut === 'non_realisee' ? <Chip tone="u">Non réalisée</Chip> : null}
              </div>
            )}
            {(l.photosApres || []).length > 0 && (
              <div className="row mt-1.5 !gap-1.5"><span className="muted small">Après :</span>{(l.photosApres || []).map((p, j) => <Photo key={j} src={p} w={64} h={48} />)}</div>
            )}
          </div>
          <div className="row flex-nowrap !gap-1.5">
            {(l.photos || []).map((p, j) => <Photo key={j} src={p} w={64} h={48} />)}
            {d.statut === 'a_completer' && <AddPhoto label="+" w={48} h={48} onFiles={f => addPhotos(i, f)} />}
          </div>
        </div>
        {edit && (
          <div className="grid-auto" style={{ '--min': '170px' } as React.CSSProperties}>
            <Field label="Imputation" htmlFor={`qi${i}`}><select className="in sm" id={`qi${i}`} value={l.imputation} onChange={e => setLine(i, 'imputation', e.target.value)}><Opts list={S.ref.imputations} /></select></Field>
            <div><label className="lbl" htmlFor={`qc${i}`}>Circuit</label><select className="in sm" id={`qc${i}`} value={l.circuit} onChange={e => setLine(i, 'circuit', e.target.value)}><Opts list={S.ref.circuits.map(c => ({ v: c.k, l: c.l }))} placeholder="Choisir…" /></select>
              {circ && <div className="muted small mt-1">{circ.d}</div>}</div>
            <div><span className="lbl">Durée estimée</span><div className="stepper">
              <button type="button" aria-label="Moins 30 minutes" onClick={() => upd(x => { x.lignes[i].duree = Math.max(30, x.lignes[i].duree - 30) })}>−</button>
              <strong>{fdur(l.duree)}</strong>
              <button type="button" aria-label="Plus 30 minutes" onClick={() => upd(x => { x.lignes[i].duree = Math.max(30, x.lignes[i].duree + 30) })}>+</button></div></div>
            <Field label="Urgence retenue" htmlFor={`qu${i}`}><select className="in sm" id={`qu${i}`} value={l.urgence || d.urgence} onChange={e => setLine(i, 'urgence', e.target.value)}><Opts list={S.ref.urgences.map(u => ({ v: u.k, l: u.l }))} /></select></Field>
          </div>
        )}
      </div>
    )
  }

  return (
    <Layout active="demandes">
      <div className="crumb"><a href="#/demandes">Demandes</a> › {d.id}</div>
      <div className="pagehead">
        <div className="t"><h1>{d.id}</h1><UrgencyChip k={d.urgence} /><StatusChip d={d} />{d.ft && <Chip>{d.ft}</Chip>}
          <span className="muted s13">reçue le {fd(d.recueLe)} à {ftime(d.recueLe)} · {age ? `il y a ${age} jour${age > 1 ? 's' : ''}` : "aujourd'hui"}</span></div>
        <div className="row !gap-2">{bar()}</div>
      </div>
      {d.statut === 'a_completer' && <Note tone="warn" className="mb-4"><span><strong>Renvoyée pour complément :</strong> {d.motifRenvoi || ''}{d.msgRenvoi ? ` — « ${d.msgRenvoi} »` : ''}. Ajoutez les photos ou précisions demandées.</span></Note>}
      {d.statut === 'a_reactualiser' && <Note className="mb-4 !border-[#DCCCF9] !bg-[#FAF7FF]">Demande de plus de 2 mois sans intervention. Sans réactualisation avant le <strong>{fd(addDays(d.recueLe, 80))}</strong>, elle sera rejetée automatiquement (motif « Non réactualisée »).</Note>}
      {d.statut === 'rejetee' && <Note className="mb-4">Rejetée : {d.motifRejet || ''}</Note>}
      <div className="cols">
        <div className="col-main">
          <section className="card pad">
            <h2 className="h2 mb-3.5">Demande</h2>
            <div className="grid-auto !gap-4" style={{ '--min': '320px' } as React.CSSProperties}>
              <Kv pairs={[
                ['Demandeur', `${d.auteur}, ${d.fonction.toLowerCase()}`], ['Téléphone', d.tel || '—'], ['Établissement', `${log?.etab} · ${log?.section}`],
                ['Facturation pressentie', d.facturation], ['Sinistre', d.sinistre + (d.sinistreInfo ? ` · ${d.sinistreInfo.nature}` : '')],
                ['Date souhaitée', d.dateSouhaitee ? fday(d.dateSouhaitee) : '—'],
              ]} />
              <Kv pairs={[
                ['Logement', <><a href={`#/logement/${log?.id}`}>{log?.id}</a> · {log?.typo} · {log?.ville} ({log?.dept})</>], ['Adresse', logAdr(log)],
                ['Accès', d.acces || log?.acces || '—'], ['Clés', `${d.numCles || '—'} · ${(d.lieuCles || '').toLowerCase()}`], ['Observations', d.observations || '—'],
              ]} />
            </div>
          </section>
          <section className="card pad">
            <div className="row between mb-3.5"><h2 className="h2">{edit ? 'Qualification par ligne' : 'Travaux demandés'}</h2>{totalST > 0 && <span className="muted s13">Durée totale estimée (ST) : <strong>{fdur(totalST)}</strong></span>}</div>
            {d.lignes.map(lineQualif)}
          </section>
          {edit && (
            <section className="card pad"><h2 className="h2 mb-2.5">Message à l'établissement</h2>
              <textarea className="in" id="qmsg" value={d.message || ''} placeholder="Facultatif : visible par le demandeur avec le statut" onChange={e => upd(x => { x.message = e.target.value })} /></section>
          )}
          {rapports.map(r => {
            const rp = r.rapport
            if (!rp) return null
            const o = getOuv(S, r.ouvrierId)
            return (
              <section key={r.id} className="card pad">
                <div className="row between mb-3"><h2 className="h2">Rapport d'intervention · {fd(r.date)}</h2><a href={`#/fiche/${d.id}`}>Voir le rapport PDF</a></div>
                <Kv pairs={[
                  ['Ouvrier', o?.nom], ['Horaires', `${ftime(r.debutReel) || r.debut} – ${ftime(r.finReel) || ''}`], ['Temps passé', fdur(rp.tempsMin)],
                  ['Consommables', rp.conso.map(c => `${c.nom} × ${c.qte}`).join(', ') || '—'],
                  ['Travaux ajoutés', (rp.supps || []).map(s => `${s.piece} · ${s.nature} (${s.suiteLabel})`).join(', ') || '—'],
                  ['Observations', rp.obs || '—'],
                  ['Signature', rp.signature ? <img src={rp.signature} alt="Signature" className="h-10" /> : rp.signataire || '—'],
                ]} />
              </section>
            )
          })}
        </div>
        <aside className="col-side">
          {rdvs.length > 0 && (
            <Card pad="md"><h2 className="h2 mb-3">Planification</h2>
              {rdvs.map(r => {
                const [el, ec] = RDV_ETAT[r.etat]
                return <div key={r.id} className="row between s13 border-b border-line2 py-1.5"><span>{fday(r.date)} · {r.debut} · {getOuv(S, r.ouvrierId)?.nom}</span><Chip tone={ec}>{el}</Chip></div>
              })}
            </Card>
          )}
          <Card pad="md"><h2 className="h2 mb-3">Historique</h2>
            <ol className="hist">{d.historique.map((h, i) => <li key={i}><span></span><div>{h.t}<div className="muted small">{fdt(h.at)}</div></div></li>)}</ol>
          </Card>
          <Card pad="md"><h2 className="h2 mb-3">Logement {log?.id}</h2>
            <Kv pairs={[
              ['Dernier constat', lastC ? `${fd(lastC.date)} · propreté ${lastC.proprete}/6, bâti ${lastC.bati.toLowerCase()}` : 'aucun'],
              ['Interventions 12 mois', String(n12)],
              ['Demande ouverte', ouvertes.length ? ouvertes.map((x, i) => <span key={x.id}>{i > 0 && ', '}<a href={`#/demande/${x.id}`}>{x.id}</a></span>) : 'aucune autre'],
            ]} />
            <a href={`#/logement/${log?.id}`} className="mt-3 inline-block text-[13px]">Voir la fiche logement</a>
          </Card>
        </aside>
      </div>
    </Layout>
  )
}

export default Qualification
