import type { CSSProperties } from 'react'
import AddPhoto from '@/components/ui/AddPhoto'
import Card from '@/components/ui/Card'
import Chip from '@/components/ui/Chip'
import Crumb from '@/components/ui/Crumb'
import Field from '@/components/ui/Field'
import Icon from '@/components/ui/Icon'
import Note from '@/components/ui/Note'
import Opts from '@/components/ui/Opts'
import Seg from '@/components/ui/Seg'
import StepHeader from '@/components/ui/StepHeader'
import PhotoView from '@/components/Photo/PhotoView'
import { TODAY, fd, ftime } from '@/helpers/dates'
import { URG_ON } from './constants'
import type { NewRequestViewProps } from './types'

/** Fiche de demande d'intervention (présentation seule) : brouillon en trois étapes + liste de contrôle avant envoi. */
const NewRequestView = ({
  model, onField, onUrgence, onSinistreInfo, onLogement, onLine, onExtra, onAddLine, onRemoveLine, onAddPhotos, onDeletePhoto, onOpenPhoto, onSend, onSave, onDiscard,
}: NewRequestViewProps) => {
  const { dr, log, constat, check: ck } = model
  const si = dr.sinistreInfo

  return (
    <>
      <div className="pagehead">
        <div><Crumb items={[{ label: 'Demandes', href: '#/demandes' }, { label: 'Nouvelle demande' }]} /><h1>Fiche de demande d'intervention</h1></div>
        <div className="row !gap-2.5"><Chip>Brouillon</Chip><span className="muted s13">N° attribué à l'envoi · enregistré automatiquement à {ftime(dr.savedAt)}</span></div>
      </div>
      {constat && (
        <Note tone="info" className="mb-4"><Icon name="info" /><span>Demande créée depuis le constat <strong>{constat.id}</strong> du {fd(constat.date)} ({constat.signalements.join(', ') || 'sans signalement'}).</span></Note>
      )}
      <div className="cols">
        <div className="col-main">
          <section className="card pad">
            <StepHeader step={1} title="Auteur et logement concerné" />
            <div className="grid-auto mb-4 border-b border-line2 pb-4" style={{ '--min': '190px' } as CSSProperties}>
              <Field label="Auteur de la demande" htmlFor="fa"><input className="in" id="fa" value={dr.auteur} onChange={e => onField('auteur', e.target.value)} /></Field>
              <Field label="Fonction" htmlFor="ff"><select className="in" id="ff" value={dr.fonction} onChange={e => onField('fonction', e.target.value)}><Opts list={model.fonctions} /></select></Field>
              <div><span className="lbl">Service</span><div className="in ro">{model.service}</div></div>
              <Field label="Téléphone" htmlFor="ft"><input className="in" id="ft" type="tel" value={dr.tel} placeholder="06 ·· ·· ·· ··" onChange={e => onField('tel', e.target.value)} /></Field>
              {model.isCoord && (
                <Field label="Reçue par" htmlFor="fc"><select className="in" id="fc" value={dr.canal} onChange={e => onField('canal', e.target.value)}><Opts list={['Fiche (saisie directe)', 'Mail', 'Téléphone']} /></select></Field>
              )}
            </div>
            <label className="lbl" htmlFor="flog">Logement ou bureau</label>
            <select className={`in${log ? '' : ' miss'}`} id="flog" value={dr.logementId} onChange={e => onLogement(e.target.value)}>
              <option value="">Rechercher par n°, adresse ou ville…</option>
              {model.groups.map(g => (
                <optgroup key={g.ville} label={g.ville}>
                  {g.items.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
                </optgroup>
              ))}
            </select>
            {log && (
              <>
                <div className="grid-auto mt-3.5" style={{ '--min': '190px' } as CSSProperties}>
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
            <StepHeader step={2} title="Intervention" />
            <div className="grid-auto !gap-4" style={{ '--min': '300px' } as CSSProperties}>
              <div>
                <span className="lbl">Niveau d'urgence</span>
                <div className={`seg${dr.urgence ? '' : ' miss'}`} role="group" aria-label="Niveau d'urgence">
                  {model.urgences.map(u => (
                    <button key={u.k} type="button" className={dr.urgence === u.k ? URG_ON[u.k] : ''} onClick={() => onUrgence(u.k)}>{u.l}</button>
                  ))}
                </div>
                <p className="muted small mb-0 mt-1.5">{model.urgenceDesc}</p>
              </div>
              <Field label="Date d'intervention souhaitée" htmlFor="fdate"><input className="in" type="date" id="fdate" value={dr.dateSouhaitee} min={TODAY} onChange={e => onField('dateSouhaitee', e.target.value)} /><p className="muted small mb-0 mt-1.5">Facultatif</p></Field>
              <Field label="Précisions d'accès" htmlFor="facc"><input className="in" id="facc" value={dr.acces} placeholder="Bâtiment, étage, porte, code" onChange={e => onField('acces', e.target.value)} /></Field>
              <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-2.5">
                <Field label="N° de clés" htmlFor="fcl"><input className="in" id="fcl" value={dr.numCles} onChange={e => onField('numCles', e.target.value)} /></Field>
                <Field label="Mise à disposition des clés" htmlFor="flc"><select className="in" id="flc" value={dr.lieuCles} onChange={e => onField('lieuCles', e.target.value)}><Opts list={model.cles} /></select></Field>
              </div>
              <div><span className="lbl">Facturation à l'usager pressentie</span><Seg values={['Oui', 'Non', 'Ne sait pas']} sel={dr.facturation} onPick={v => onField('facturation', v)} /><p className="muted small mb-0 mt-1.5">Décision finale par la coordination.</p></div>
              <div><span className="lbl">Sinistre à déclarer à une assurance ?</span><Seg values={['Oui', 'Non', 'Ne sait pas']} sel={dr.sinistre} onPick={v => onField('sinistre', v)} /><p className="muted small mb-0 mt-1.5">Dégât des eaux (y compris venant d'un voisin ou des parties communes), incendie, effraction, bris de glace.</p></div>
              <Field label="Observations" htmlFor="fobs" className="col-span-full"><textarea className="in" id="fobs" value={dr.observations} placeholder="Présence de l'occupant, contraintes horaires…" onChange={e => onField('observations', e.target.value)} /></Field>
            </div>
            {dr.sinistre === 'Oui' && (
              <div className="mt-4 rounded-lg border border-violet-line bg-violet-bg p-3.5">
                <strong className="s13 text-violet">Sinistre / assurance — informations complémentaires</strong>
                <div className="grid-auto mt-2.5" style={{ '--min': '220px' } as CSSProperties}>
                  <Field label="Nature du sinistre" htmlFor="fsn"><select className={`in${si.nature ? '' : ' miss'}`} id="fsn" value={si.nature} onChange={e => onSinistreInfo('nature', e.target.value)}><Opts list={model.natSinistre} placeholder="Choisir…" /></select></Field>
                  <Field label="Date de survenance" htmlFor="fsd"><input className="in" type="date" id="fsd" value={si.date} max={TODAY} onChange={e => onSinistreInfo('date', e.target.value)} /></Field>
                  <Field label="Fuite stoppée" htmlFor="fsf"><select className="in" id="fsf" value={si.fuite} onChange={e => onSinistreInfo('fuite', e.target.value)}><Opts list={['Oui', 'Non', 'Sans objet']} placeholder="—" /></select></Field>
                  <Field label="Tiers concerné" htmlFor="fst"><select className="in" id="fst" value={si.tiers} onChange={e => onSinistreInfo('tiers', e.target.value)}><Opts list={['Aucun', 'Voisin', 'Syndic', 'Bailleur']} placeholder="—" /></select></Field>
                  <Field label="Constat amiable rempli" htmlFor="fsc"><select className="in" id="fsc" value={si.constat} onChange={e => onSinistreInfo('constat', e.target.value)}><Opts list={['Oui (photo jointe)', 'Non']} placeholder="—" /></select></Field>
                </div>
              </div>
            )}
          </section>

          <section className="card pad">
            <StepHeader step={3} title="Problèmes à traiter"><span className="muted s13">une ligne par problème · photo obligatoire</span></StepHeader>
            {dr.lignes.map((l, i) => {
              const natures = l.lot ? model.lots[l.lot] || [] : []
              const ok = l.piece && l.lot && l.nature && l.description.trim() && l.photos.length
              const status = !(l.piece && l.lot && l.nature && l.description.trim()) ? <Chip>À compléter</Chip> : !l.photos.length ? <Chip tone="h48">Photo manquante</Chip> : <Chip tone="ok">Complète</Chip>
              return (
                <div key={i} className={`line ${ok ? '' : '!border-2 !border-danger-line !bg-danger-wash'}`}>
                  <div className="row between mb-3">
                    <strong className="text-sm">Ligne {i + 1}</strong>
                    <div className="row !gap-2">{status}{dr.lignes.length > 1 && <button className="linkbtn small" onClick={() => onRemoveLine(i)}>Supprimer</button>}</div>
                  </div>
                  <div className="grid-auto" style={{ '--min': '200px' } as CSSProperties}>
                    <Field label="Pièce" htmlFor={`lp${i}`}>
                      <select className={`in${l.piece ? '' : ' miss'}`} id={`lp${i}`} value={l.piece} onChange={e => onLine(i, 'piece', e.target.value)}>
                        <option value="">Choisir…</option>
                        <optgroup label={`Pièces du logement${log ? ' · ' + log.typo : ''}`}><Opts list={model.pieces} /></optgroup>
                        <optgroup label="Autres"><Opts list={model.autresPieces} /></optgroup>
                      </select></Field>
                    <Field label="Lot de travaux" htmlFor={`ll${i}`}><select className={`in${l.lot ? '' : ' miss'}`} id={`ll${i}`} value={l.lot} onChange={e => onLine(i, 'lot', e.target.value)}><Opts list={Object.keys(model.lots)} placeholder="Choisir…" /></select></Field>
                    <Field label="Nature" htmlFor={`ln${i}`}><select className={`in${l.nature ? '' : ' miss'}`} id={`ln${i}`} value={l.nature} disabled={!l.lot} onChange={e => onLine(i, 'nature', e.target.value)}><Opts list={natures} placeholder={l.lot ? 'Choisir…' : "Choisir d'abord le lot"} /></select></Field>
                  </div>
                  <Field label={<>Description{l.lot && l.lot.startsWith('Autre') ? ' (obligatoire)' : ''}</>} htmlFor={`lt${i}`} className="mt-3">
                    <textarea className={`in min-h-14${l.description.trim() ? '' : ' miss'}`} id={`lt${i}`} rows={2} value={l.description} placeholder="Ce que l'on constate, depuis quand, ce qui a déjà été fait" onChange={e => onLine(i, 'description', e.target.value)} /></Field>
                  {l.lot === 'Déménagement / transfert' && (
                    <div className="grid-auto mt-3 rounded-lg bg-panel p-3" style={{ '--min': '200px' } as CSSProperties}>
                      <div><span className="lbl">Logement d'arrivée</span><select className="in" value={l.extra.arrivee || ''} onChange={e => onExtra(i, 'arrivee', e.target.value)}><Opts list={model.arrivee} placeholder="—" /></select></div>
                      <div><span className="lbl">Date et plage horaire</span><input className="in" value={l.extra.plage || ''} placeholder="ex. 12/11 matin" onChange={e => onExtra(i, 'plage', e.target.value)} /></div>
                      <div><span className="lbl">Volume</span><select className="in" value={l.extra.volume || ''} onChange={e => onExtra(i, 'volume', e.target.value)}><Opts list={['Quelques meubles', 'Studio', 'T2', 'T3', 'T4']} placeholder="—" /></select></div>
                      <div><span className="lbl">Étages et ascenseur</span><input className="in" value={l.extra.etages || ''} placeholder="départ / arrivée" onChange={e => onExtra(i, 'etages', e.target.value)} /></div>
                      <div><span className="lbl">Besoins</span><input className="in" value={l.extra.besoins || ''} placeholder="cartons, véhicule, 2e ouvrier" onChange={e => onExtra(i, 'besoins', e.target.value)} /></div>
                      <div><span className="lbl">Présence du ménage le jour J</span><select className="in" value={l.extra.presence || ''} onChange={e => onExtra(i, 'presence', e.target.value)}><Opts list={['Oui', 'Non', 'Ne sait pas']} placeholder="—" /></select></div>
                    </div>
                  )}
                  <div className="mt-3">
                    <span className="lbl">Photos ({l.photos.length})</span>
                    <div className="row !gap-2.5">
                      {l.photos.map((p, j) => <PhotoView key={j} src={p} onOpen={onOpenPhoto} onDelete={() => onDeletePhoto(i, j)} />)}
                      {l.photos.length
                        ? <AddPhoto onFiles={f => onAddPhotos(i, f)} />
                        : <AddPhoto onFiles={f => onAddPhotos(i, f)} label="Prendre ou ajouter une photo (obligatoire)" w={320} req />}
                    </div>
                  </div>
                </div>
              )
            })}
            <button className="btn btn-w btn-dash" onClick={onAddLine}>+ Ajouter un problème</button>
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
            <button className="btn btnp btn-w mt-[18px]" disabled={!ck.ok} onClick={onSend}>Envoyer la demande</button>
            <button className="btn btn-w mt-2.5" onClick={onSave}>Enregistrer le brouillon</button>
            <button className="linkbtn small mt-3" onClick={onDiscard}>Abandonner ce brouillon</button>
          </Card>
          <Card pad="md" className="s13 leading-normal">
            <h2 className="h2 mb-2 !text-sm">Après l'envoi</h2>
            <p className="mb-1.5 mt-0">Accusé de réception par mail avec le n° de demande.</p>
            <p className="mb-1.5 mt-0">Photos classées automatiquement dans le dossier du logement.</p>
            <p className="m-0">Suivi du statut dans l'onglet <a href="#/demandes">Demandes</a>.</p>
          </Card>
        </aside>
      </div>
    </>
  )
}

export default NewRequestView
