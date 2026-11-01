import Icon from '@/components/ui/Icon'
import { useEffect } from 'react'
import type { Demande, DraftDemande, UrgenceKey } from '@/types'
import { useApp } from '@/hooks/useApp'
import { go, useRoute } from '@/hooks/useRoute'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Chip from '@/components/ui/Chip'
import Field from '@/components/ui/Field'
import Note from '@/components/ui/Note'
import Opts from '@/components/ui/Opts'
import Seg from '@/components/ui/Seg'
import AddPhoto from '@/components/ui/AddPhoto'
import Photo from '@/components/Photo'

import { TODAY, fd, ftime, now } from '@/helpers/dates'
import { getLog, hist, nbPhotos, nextId, piecesFor, profilOf } from '@/helpers/domain'
import { readPhotos } from '@/helpers/photos'
import { URG_ON } from './constants'
import { check, emptyLine, getCe, logLabel, newDraft } from './helpers'


const NewRequest = () => {
  const { S, mutate, getS, toast, openModal } = useApp()
  const { query: q } = useRoute()
  const dr = S.draft
  const needInit = !dr || (!!q.log && dr.logementId !== q.log) || (!!S.moi && dr.auteurEmail !== S.moi.email)

  useEffect(() => {
    // newDraft lit l'identité du compte connecté, absente de la copie passée à mutate : on la prend dans l'état exposé.
    if (needInit) { const base = getS(); mutate(s => { s.draft = newDraft(base, q.log, q.constat) }) }
  }, [needInit, q.log, q.constat, mutate, getS])

  if (!dr || needInit) return <Layout />

  const upd = (fn: (d: DraftDemande) => void) => mutate(s => { if (s.draft) { fn(s.draft); s.draft.savedAt = now() } })
  const log = getLog(S, dr.logementId)
  const ck = check(S, dr)
  const villes = [...new Set(S.logements.map(l => l.ville))].sort()
  const urgDesc = (S.ref.urgences.find(u => u.k === dr.urgence) || { d: 'Urgent : sécurité, fuite active, porte bloquée, panne générale.' }).d
  const si = dr.sinistreInfo
  const constat = getCe(S, dr.constatId)
  const pp = piecesFor(S, log)

  const onLog = (id: string) => upd(d => {
    d.logementId = id
    const l = getS().logements.find(x => x.id === id)
    if (l) { d.acces = l.acces || d.acces; d.numCles = l.cles !== '—' ? l.cles : '' }
    const p = piecesFor(getS(), l)
    d.lignes.forEach(li => { if (li.piece && ![...p.pieces, ...p.autres].includes(li.piece)) li.piece = '' })
  })
  const setLine = (i: number, k: 'piece' | 'lot' | 'nature' | 'description', v: string) => upd(d => {
    d.lignes[i][k] = v
    if (k === 'lot') { d.lignes[i].nature = ''; if (v === 'Sinistre / assurance') d.sinistre = 'Oui' }
  })
  const setExtra = (i: number, k: string, v: string) => upd(d => { d.lignes[i].extra[k] = v })
  const addPhotos = (i: number, files: FileList) => {
    readPhotos(files).then(ph => mutate(s => { s.draft?.lignes[i].photos.push(...ph) }, { now: true })).catch(() => toast('Photo illisible', 'err'))
  }

  const save = () => { mutate(s => { if (s.draft) s.draft.savedAt = now() }, { now: true }); toast('Brouillon enregistré', 'ok') }
  const discard = () => openModal({
    title: 'Abandonner le brouillon', danger: true, okLabel: 'Abandonner',
    body: <p className="m-0">Les informations et photos saisies seront perdues.</p>,
    onOk() { mutate(s => { s.draft = null }, { now: true }); go('#/demandes') },
  })
  const send = () => {
    if (!ck.ok) return
    let newId = ''
    mutate(s => {
      const x = s.draft
      if (!x) return
      const lg = s.logements.find(l => l.id === x.logementId)
      const origine: Demande['origine'] = x.canal === 'Mail' ? 'mail' : x.canal === 'Téléphone' ? 'tel' : 'etab'
      const d: Demande = {
        id: nextId(s, 'di'), recueLe: now(), logementId: x.logementId, origine, auteur: x.auteur, auteurEmail: x.auteurEmail, fonction: x.fonction, tel: x.tel,
        urgence: x.urgence as UrgenceKey, dateSouhaitee: x.dateSouhaitee, acces: x.acces, numCles: x.numCles, lieuCles: x.lieuCles,
        facturation: x.facturation, sinistre: x.sinistre, sinistreInfo: x.sinistre === 'Oui' ? x.sinistreInfo : null,
        observations: x.observations, message: '', consommables: [], historique: [], statut: 'a_qualifier', ft: '', constatId: x.constatId || '',
        lignes: x.lignes.map(l => ({
          piece: l.piece, lot: l.lot, nature: l.nature, description: l.description, photos: l.photos, extra: l.extra,
          imputation: x.facturation === 'Oui' ? 'Usager (refacturation)' : 'Equalis',
          circuit: l.lot === 'Sinistre / assurance' ? 'sinistre' : '', duree: 60, urgence: '', statut: '',
        })),
      }
      hist(d, origine === 'etab' ? `Demande créée par ${x.auteur}` : `Saisie par la coordination (${x.canal.toLowerCase()})`)
      const nph = nbPhotos(d)
      if (nph && lg) hist(d, `${nph} photo${nph > 1 ? 's' : ''} classée${nph > 1 ? 's' : ''} dans ${lg.dept} › ${lg.ville} › ${lg.id}`)
      hist(d, 'Accusé de réception envoyé au demandeur')
      if (d.constatId) { const c = s.constats.find(k => k.id === d.constatId); if (c) { c.demandeId = d.id; c.suite = 'demande' } }
      s.demandes.unshift(d)
      s.draft = null
      newId = d.id
    }, { now: true })
    toast(`Demande ${newId} envoyée · accusé de réception envoyé`, 'ok')
    go('#/demande/' + newId)
  }

  return (
    <Layout>
      <div className="pagehead">
        <div><div className="crumb"><a href="#/demandes">Demandes</a> › Nouvelle demande</div><h1>Fiche de demande d'intervention</h1></div>
        <div className="row !gap-2.5"><Chip>Brouillon</Chip><span className="muted s13">N° attribué à l'envoi · enregistré automatiquement à {ftime(dr.savedAt)}</span></div>
      </div>
      {constat && (
        <Note tone="info" className="mb-4"><Icon name="info" /><span>Demande créée depuis le constat <strong>{constat.id}</strong> du {fd(constat.date)} ({constat.signalements.join(', ') || 'sans signalement'}).</span></Note>
      )}
      <div className="cols">
        <div className="col-main">
          <section className="card pad">
            <div className="sec-h"><span className="step">1</span><h2 className="h2">Auteur et logement concerné</h2></div>
            <div className="grid-auto mb-4 border-b border-line2 pb-4" style={{ '--min': '190px' } as React.CSSProperties}>
              <Field label="Auteur de la demande" htmlFor="fa"><input className="in" id="fa" value={dr.auteur} onChange={e => upd(d => { d.auteur = e.target.value })} /></Field>
              <Field label="Fonction" htmlFor="ff"><select className="in" id="ff" value={dr.fonction} onChange={e => upd(d => { d.fonction = e.target.value })}><Opts list={S.ref.fonctions} /></select></Field>
              <div><span className="lbl">Service</span><div className="in ro">{log ? log.etab : profilOf(S).etab || '—'}</div></div>
              <Field label="Téléphone" htmlFor="ft"><input className="in" id="ft" type="tel" value={dr.tel} placeholder="06 ·· ·· ·· ··" onChange={e => upd(d => { d.tel = e.target.value })} /></Field>
              {S.profil === 'coord' && (
                <Field label="Reçue par" htmlFor="fc"><select className="in" id="fc" value={dr.canal} onChange={e => upd(d => { d.canal = e.target.value })}><Opts list={['Fiche (saisie directe)', 'Mail', 'Téléphone']} /></select></Field>
              )}
            </div>
            <label className="lbl" htmlFor="flog">Logement ou bureau</label>
            <select className={`in${log ? '' : ' miss'}`} id="flog" value={dr.logementId} onChange={e => onLog(e.target.value)}>
              <option value="">Rechercher par n°, adresse ou ville…</option>
              {villes.map(v => (
                <optgroup key={v} label={v}>
                  {S.logements.filter(l => l.ville === v && (S.profil !== 'etab' || l.etab === profilOf(S).etab || l.typo === 'BUR')).map(l => <option key={l.id} value={l.id}>{logLabel(l)}</option>)}
                </optgroup>
              ))}
            </select>
            {log && (
              <>
                <div className="grid-auto mt-3.5" style={{ '--min': '190px' } as React.CSSProperties}>
                  <div><span className="lbl">Établissement</span><div className="in ro">{log.etab}</div></div>
                  <div><span className="lbl">Code section</span><div className="in ro">{log.section}</div></div>
                  <div><span className="lbl">Typologie</span><div className="in ro">{log.typo === 'BUR' ? 'Bureaux' : log.typo} · {log.etage}</div></div>
                  <div><span className="lbl">CGL</span><div className="in ro">{log.cgl}</div></div>
                  <div><span className="lbl">Dispositif</span><div className="in ro">{log.dispositif}</div></div>
                  <div><span className="lbl">Ménage (n° famille)</span><div className="in ro">{log.menage}</div></div>
                </div>
                <p className="muted small mb-0 mt-2.5">Champs remplis automatiquement depuis le référentiel logements. Logement introuvable ? Contacter la coordination.</p>
              </>
            )}
          </section>

          <section className="card pad">
            <div className="sec-h"><span className="step">2</span><h2 className="h2">Intervention</h2></div>
            <div className="grid-auto !gap-4" style={{ '--min': '300px' } as React.CSSProperties}>
              <div>
                <span className="lbl">Niveau d'urgence</span>
                <div className={`seg${dr.urgence ? '' : ' miss'}`} role="group" aria-label="Niveau d'urgence">
                  {S.ref.urgences.map(u => (
                    <button key={u.k} type="button" className={dr.urgence === u.k ? URG_ON[u.k] : ''} onClick={() => upd(d => { d.urgence = u.k })}>{u.l}</button>
                  ))}
                </div>
                <p className="muted small mb-0 mt-1.5">{urgDesc}</p>
              </div>
              <Field label="Date d'intervention souhaitée" htmlFor="fdate"><input className="in" type="date" id="fdate" value={dr.dateSouhaitee} min={TODAY} onChange={e => upd(d => { d.dateSouhaitee = e.target.value })} /><p className="muted small mb-0 mt-1.5">Facultatif</p></Field>
              <Field label="Précisions d'accès" htmlFor="facc"><input className="in" id="facc" value={dr.acces} placeholder="Bâtiment, étage, porte, code" onChange={e => upd(d => { d.acces = e.target.value })} /></Field>
              <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-2.5">
                <Field label="N° de clés" htmlFor="fcl"><input className="in" id="fcl" value={dr.numCles} onChange={e => upd(d => { d.numCles = e.target.value })} /></Field>
                <Field label="Mise à disposition des clés" htmlFor="flc"><select className="in" id="flc" value={dr.lieuCles} onChange={e => upd(d => { d.lieuCles = e.target.value })}><Opts list={S.ref.cles} /></select></Field>
              </div>
              <div><span className="lbl">Facturation à l'usager pressentie</span><Seg values={['Oui', 'Non', 'Ne sait pas']} sel={dr.facturation} onPick={v => upd(d => { d.facturation = v })} /><p className="muted small mb-0 mt-1.5">Décision finale par la coordination.</p></div>
              <div><span className="lbl">Sinistre à déclarer à une assurance ?</span><Seg values={['Oui', 'Non', 'Ne sait pas']} sel={dr.sinistre} onPick={v => upd(d => { d.sinistre = v })} /><p className="muted small mb-0 mt-1.5">Dégât des eaux (y compris venant d'un voisin ou des parties communes), incendie, effraction, bris de glace.</p></div>
              <Field label="Observations" htmlFor="fobs" className="col-span-full"><textarea className="in" id="fobs" value={dr.observations} placeholder="Présence de l'occupant, contraintes horaires…" onChange={e => upd(d => { d.observations = e.target.value })} /></Field>
            </div>
            {dr.sinistre === 'Oui' && (
              <div className="mt-4 rounded-lg border border-[#DCCCF9] bg-[#FAF7FF] p-3.5">
                <strong className="s13 text-violet">Sinistre / assurance — informations complémentaires</strong>
                <div className="grid-auto mt-2.5" style={{ '--min': '220px' } as React.CSSProperties}>
                  <Field label="Nature du sinistre" htmlFor="fsn"><select className={`in${si.nature ? '' : ' miss'}`} id="fsn" value={si.nature} onChange={e => upd(d => { d.sinistreInfo.nature = e.target.value })}><Opts list={S.ref.natSinistre} placeholder="Choisir…" /></select></Field>
                  <Field label="Date de survenance" htmlFor="fsd"><input className="in" type="date" id="fsd" value={si.date} max={TODAY} onChange={e => upd(d => { d.sinistreInfo.date = e.target.value })} /></Field>
                  <Field label="Fuite stoppée" htmlFor="fsf"><select className="in" id="fsf" value={si.fuite} onChange={e => upd(d => { d.sinistreInfo.fuite = e.target.value })}><Opts list={['Oui', 'Non', 'Sans objet']} placeholder="—" /></select></Field>
                  <Field label="Tiers concerné" htmlFor="fst"><select className="in" id="fst" value={si.tiers} onChange={e => upd(d => { d.sinistreInfo.tiers = e.target.value })}><Opts list={['Aucun', 'Voisin', 'Syndic', 'Bailleur']} placeholder="—" /></select></Field>
                  <Field label="Constat amiable rempli" htmlFor="fsc"><select className="in" id="fsc" value={si.constat} onChange={e => upd(d => { d.sinistreInfo.constat = e.target.value })}><Opts list={['Oui (photo jointe)', 'Non']} placeholder="—" /></select></Field>
                </div>
              </div>
            )}
          </section>

          <section className="card pad">
            <div className="sec-h"><span className="step">3</span><h2 className="h2">Problèmes à traiter</h2><span className="muted s13">une ligne par problème · photo obligatoire</span></div>
            {dr.lignes.map((l, i) => {
              const natures = l.lot ? S.ref.lots[l.lot] || [] : []
              const ok = l.piece && l.lot && l.nature && l.description.trim() && l.photos.length
              const status = !(l.piece && l.lot && l.nature && l.description.trim()) ? <Chip>À compléter</Chip> : !l.photos.length ? <Chip tone="h48">Photo manquante</Chip> : <Chip tone="ok">Complète</Chip>
              return (
                <div key={i} className={`line ${ok ? '' : '!border-2 !border-[#F2A5A5] !bg-[#FFFBFB]'}`}>
                  <div className="row between mb-3">
                    <strong className="text-sm">Ligne {i + 1}</strong>
                    <div className="row !gap-2">{status}{dr.lignes.length > 1 && <button className="linkbtn small" onClick={() => upd(d => { d.lignes.splice(i, 1) })}>Supprimer</button>}</div>
                  </div>
                  <div className="grid-auto" style={{ '--min': '200px' } as React.CSSProperties}>
                    <Field label="Pièce" htmlFor={`lp${i}`}>
                      <select className={`in${l.piece ? '' : ' miss'}`} id={`lp${i}`} value={l.piece} onChange={e => setLine(i, 'piece', e.target.value)}>
                        <option value="">Choisir…</option>
                        <optgroup label={`Pièces du logement${log ? ' · ' + log.typo : ''}`}><Opts list={pp.pieces} /></optgroup>
                        <optgroup label="Autres"><Opts list={pp.autres} /></optgroup>
                      </select></Field>
                    <Field label="Lot de travaux" htmlFor={`ll${i}`}><select className={`in${l.lot ? '' : ' miss'}`} id={`ll${i}`} value={l.lot} onChange={e => setLine(i, 'lot', e.target.value)}><Opts list={Object.keys(S.ref.lots)} placeholder="Choisir…" /></select></Field>
                    <Field label="Nature" htmlFor={`ln${i}`}><select className={`in${l.nature ? '' : ' miss'}`} id={`ln${i}`} value={l.nature} disabled={!l.lot} onChange={e => setLine(i, 'nature', e.target.value)}><Opts list={natures} placeholder={l.lot ? 'Choisir…' : "Choisir d'abord le lot"} /></select></Field>
                  </div>
                  <Field label={<>Description{l.lot && l.lot.startsWith('Autre') ? ' (obligatoire)' : ''}</>} htmlFor={`lt${i}`} className="mt-3">
                    <textarea className={`in min-h-14${l.description.trim() ? '' : ' miss'}`} id={`lt${i}`} rows={2} value={l.description} placeholder="Ce que l'on constate, depuis quand, ce qui a déjà été fait" onChange={e => setLine(i, 'description', e.target.value)} /></Field>
                  {l.lot === 'Déménagement / transfert' && (
                    <div className="grid-auto mt-3 rounded-lg bg-panel p-3" style={{ '--min': '200px' } as React.CSSProperties}>
                      <div><span className="lbl">Logement d'arrivée</span><select className="in" value={l.extra.arrivee || ''} onChange={e => setExtra(i, 'arrivee', e.target.value)}><Opts list={S.logements.map(x => ({ v: x.id, l: `${x.id} · ${x.ville}` }))} placeholder="—" /></select></div>
                      <div><span className="lbl">Date et plage horaire</span><input className="in" value={l.extra.plage || ''} placeholder="ex. 12/11 matin" onChange={e => setExtra(i, 'plage', e.target.value)} /></div>
                      <div><span className="lbl">Volume</span><select className="in" value={l.extra.volume || ''} onChange={e => setExtra(i, 'volume', e.target.value)}><Opts list={['Quelques meubles', 'Studio', 'T2', 'T3', 'T4']} placeholder="—" /></select></div>
                      <div><span className="lbl">Étages et ascenseur</span><input className="in" value={l.extra.etages || ''} placeholder="départ / arrivée" onChange={e => setExtra(i, 'etages', e.target.value)} /></div>
                      <div><span className="lbl">Besoins</span><input className="in" value={l.extra.besoins || ''} placeholder="cartons, véhicule, 2e ouvrier" onChange={e => setExtra(i, 'besoins', e.target.value)} /></div>
                      <div><span className="lbl">Présence du ménage le jour J</span><select className="in" value={l.extra.presence || ''} onChange={e => setExtra(i, 'presence', e.target.value)}><Opts list={['Oui', 'Non', 'Ne sait pas']} placeholder="—" /></select></div>
                    </div>
                  )}
                  <div className="mt-3">
                    <span className="lbl">Photos ({l.photos.length})</span>
                    <div className="row !gap-2.5">
                      {l.photos.map((p, j) => <Photo key={j} src={p} onDelete={() => upd(d => { d.lignes[i].photos.splice(j, 1) })} />)}
                      {l.photos.length
                        ? <AddPhoto onFiles={f => addPhotos(i, f)} />
                        : <AddPhoto onFiles={f => addPhotos(i, f)} label="Prendre ou ajouter une photo (obligatoire)" w={320} req />}
                    </div>
                  </div>
                </div>
              )
            })}
            <button className="btn btn-w btn-dash" onClick={() => upd(d => { d.lignes.push(emptyLine()) })}>+ Ajouter un problème</button>
          </section>
        </div>

        <aside className="col-side sticky top-20">
          <Card pad="md">
            <h2 className="h2 mb-3.5">Avant envoi</h2>
            <ul className="checklist">
              {ck.items.map(([k, t], i) => (
                <li key={i}><span className={`font-bold ${k === 'ok' ? 'text-good' : k === 'wa' ? 'text-danger' : 'text-muted'}`}>{k === 'ok' ? '✓' : k === 'wa' ? '!' : '–'}</span>{t}</li>
              ))}
            </ul>
            <button className="btn btnp btn-w mt-[18px]" disabled={!ck.ok} onClick={send}>Envoyer la demande</button>
            <button className="btn btn-w mt-2.5" onClick={save}>Enregistrer le brouillon</button>
            <button className="linkbtn small mt-3" onClick={discard}>Abandonner ce brouillon</button>
          </Card>
          <Card pad="md" className="s13 leading-normal">
            <h2 className="h2 mb-2 !text-sm">Après l'envoi</h2>
            <p className="mb-1.5 mt-0">Accusé de réception par mail avec le n° de demande.</p>
            <p className="mb-1.5 mt-0">Photos classées automatiquement dans le dossier du logement.</p>
            <p className="m-0">Suivi du statut dans l'onglet <a href="#/demandes">Demandes</a>.</p>
          </Card>
        </aside>
      </div>
    </Layout>
  )
}

export default NewRequest
