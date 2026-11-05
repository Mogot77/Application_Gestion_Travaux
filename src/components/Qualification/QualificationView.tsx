import { Fragment, type CSSProperties } from 'react'
import AddPhoto from '@/components/ui/AddPhoto'
import Card from '@/components/ui/Card'
import Chip from '@/components/ui/Chip'
import Crumb from '@/components/ui/Crumb'
import Field from '@/components/ui/Field'
import Kv from '@/components/ui/Kv'
import Note from '@/components/ui/Note'
import Opts from '@/components/ui/Opts'
import PhotoView from '@/components/Photo/PhotoView'
import { lineLabel, logAdr } from '@/helpers/domain'
import { addDays, fd, fday, fdt, fdur, ftime } from '@/helpers/dates'
import type { QualificationViewProps } from './types'

/** Fiche de qualification d'une demande (présentation seule). */
const QualificationView = ({ model, onAction, onSetLine, onDuree, onAddPhotos, onMessage, onOpenPhoto }: QualificationViewProps) => {
  const { d, log, edit, age, urgence, status, bar, totalST, lines, rapports, rdvs, lastC, ouvertes, n12 } = model

  return (
    <>
      <Crumb items={[{ label: 'Demandes', href: '#/demandes' }, { label: d.id }]} />
      <div className="pagehead">
        <div className="t"><h1>{d.id}</h1>{urgence && <Chip tone={urgence[1]}>{urgence[0]}</Chip>}<Chip tone={status[1]}>{status[0]}</Chip>{d.ft && <Chip>{d.ft}</Chip>}
          <span className="muted s13">reçue le {fd(d.recueLe)} à {ftime(d.recueLe)} · {age ? `il y a ${age} jour${age > 1 ? 's' : ''}` : "aujourd'hui"}</span></div>
        <div className="row !gap-2">
          {bar.map(b => {
            const el = b.href
              ? <a className={b.className} href={b.href}>{b.label}</a>
              : <button className={b.className} onClick={() => b.action && onAction(b.action)}>{b.label}</button>
            return b.wrap ? <span key={b.key} className="contents">{el}</span> : <Fragment key={b.key}>{el}</Fragment>
          })}
        </div>
      </div>
      {d.statut === 'a_completer' && <Note tone="warn" className="mb-4"><span><strong>Renvoyée pour complément :</strong> {d.motifRenvoi || ''}{d.msgRenvoi ? ` — « ${d.msgRenvoi} »` : ''}. Ajoutez les photos ou précisions demandées.</span></Note>}
      {d.statut === 'a_reactualiser' && <Note className="mb-4 !border-violet-line !bg-violet-bg">Demande de plus de 2 mois sans intervention. Sans réactualisation avant le <strong>{fd(addDays(d.recueLe, 80))}</strong>, elle sera rejetée automatiquement (motif « Non réactualisée »).</Note>}
      {d.statut === 'rejetee' && <Note className="mb-4">Rejetée : {d.motifRejet || ''}</Note>}
      <div className="cols">
        <div className="col-main">
          <section className="card pad">
            <h2 className="h2 mb-3.5">Demande</h2>
            <div className="grid-auto !gap-4" style={{ '--min': '320px' } as CSSProperties}>
              <Kv pairs={[
                ['Demandeur', `${d.auteur}, ${d.fonction.toLowerCase()}`], ['Téléphone', d.tel || '—'], ['Établissement', `${log?.etab} · ${log?.section}`],
                ['Facturation pressentie', d.facturation], ['Sinistre', d.sinistre + (d.sinistreInfo ? ` · ${d.sinistreInfo.nature}` : '')],
                ['Date souhaitée', d.dateSouhaitee ? fday(d.dateSouhaitee) : '—'],
                ...(d.rdvLocataire?.length ? [['RDV prévalidés (locataire)', d.rdvLocataire.map(r => fdt(r)).join(' · ')] as [string, string]] : []),
              ]} />
              <Kv pairs={[
                ['Logement', <><a href={`#/logement/${log?.id}`}>{log?.id}</a> · {log?.typo} · {log?.ville} ({log?.dept})</>], ['Adresse', logAdr(log)],
                ['Accès', d.acces || log?.acces || '—'], ['Clés', `${d.numCles || '—'} · ${(d.lieuCles || '').toLowerCase()}`], ['Observations', d.observations || '—'],
              ]} />
            </div>
          </section>
          <section className="card pad">
            <div className="row between mb-3.5"><h2 className="h2">{edit ? 'Qualification par ligne' : 'Travaux demandés'}</h2>{totalST > 0 && <span className="muted s13">Durée totale estimée (ST) : <strong>{fdur(totalST)}</strong></span>}</div>
            {lines.map(({ l, circuitText, circuitDesc }, i) => (
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
                        {l.circuit && <Chip>{circuitText}</Chip>}
                        {l.imputation && <Chip tone={l.imputation.startsWith('Usager') ? 'h48' : 'gr'}>{l.imputation}</Chip>}
                        {l.circuit === 'ST' && <Chip>{fdur(l.duree)}</Chip>}
                        {l.statut === 'realisee' ? <Chip tone="ok">Réalisée</Chip> : l.statut === 'partielle' ? <Chip tone="h48">Partielle</Chip> : l.statut === 'non_realisee' ? <Chip tone="u">Non réalisée</Chip> : null}
                      </div>
                    )}
                    {(l.photosApres || []).length > 0 && (
                      <div className="row mt-1.5 !gap-1.5"><span className="muted small">Après :</span>{(l.photosApres || []).map((p, j) => <PhotoView key={j} src={p} w={64} h={48} onOpen={onOpenPhoto} />)}</div>
                    )}
                  </div>
                  <div className="row flex-nowrap !gap-1.5">
                    {(l.photos || []).map((p, j) => <PhotoView key={j} src={p} w={64} h={48} onOpen={onOpenPhoto} />)}
                    {d.statut === 'a_completer' && <AddPhoto label="+" w={48} h={48} onFiles={f => onAddPhotos(i, f)} />}
                  </div>
                </div>
                {edit && (
                  <div className="grid-auto" style={{ '--min': '170px' } as CSSProperties}>
                    <Field label="Imputation" htmlFor={`qi${i}`}><select className="in sm" id={`qi${i}`} value={l.imputation} onChange={e => onSetLine(i, 'imputation', e.target.value)}><Opts list={model.imputations} /></select></Field>
                    <div><label className="lbl" htmlFor={`qc${i}`}>Circuit</label><select className="in sm" id={`qc${i}`} value={l.circuit} onChange={e => onSetLine(i, 'circuit', e.target.value)}><Opts list={model.circuitOptions} placeholder="Choisir…" /></select>
                      {circuitDesc !== undefined && <div className="muted small mt-1">{circuitDesc}</div>}</div>
                    <div><span className="lbl">Durée estimée</span><div className="stepper">
                      <button type="button" aria-label="Moins 30 minutes" onClick={() => onDuree(i, -30)}>−</button>
                      <strong>{fdur(l.duree)}</strong>
                      <button type="button" aria-label="Plus 30 minutes" onClick={() => onDuree(i, 30)}>+</button></div></div>
                    <Field label="Urgence retenue" htmlFor={`qu${i}`}><select className="in sm" id={`qu${i}`} value={l.urgence || d.urgence} onChange={e => onSetLine(i, 'urgence', e.target.value)}><Opts list={model.urgenceOptions} /></select></Field>
                  </div>
                )}
              </div>
            ))}
          </section>
          {edit && (
            <section className="card pad"><h2 className="h2 mb-2.5">Message à l'établissement</h2>
              <textarea className="in" id="qmsg" value={d.message || ''} placeholder="Facultatif : visible par le demandeur avec le statut" onChange={e => onMessage(e.target.value)} /></section>
          )}
          {rapports.map(({ r, rp, ouvrier }) => (
            <section key={r.id} className="card pad">
              <div className="row between mb-3"><h2 className="h2">Rapport d'intervention · {fd(r.date)}</h2><a href={`#/fiche/${d.id}`}>Voir le rapport PDF</a></div>
              <Kv pairs={[
                ['Ouvrier', ouvrier], ['Horaires', `${ftime(r.debutReel) || r.debut} – ${ftime(r.finReel) || ''}`], ['Temps passé', fdur(rp.tempsMin)],
                ['Consommables', rp.conso.map(c => `${c.nom} × ${c.qte}`).join(', ') || '—'],
                ['Travaux ajoutés', (rp.supps || []).map(s => `${s.piece ? s.piece + ' · ' : ''}${s.nature || s.description} (${s.suiteLabel})`).join(', ') || '—'],
                ['Observations', rp.obs || '—'],
                ['Signature', rp.signature ? <img src={rp.signature} alt="Signature" className="h-10" /> : rp.signataire || '—'],
              ]} />
            </section>
          ))}
        </div>
        <aside className="col-side">
          {rdvs.length > 0 && (
            <Card pad="md"><h2 className="h2 mb-3">Planification</h2>
              {rdvs.map(({ r, ouvrier, etat: [el, ec] }) => (
                <div key={r.id} className="row between s13 border-b border-line2 py-1.5"><span>{fday(r.date)} · {r.debut} · {ouvrier}</span><Chip tone={ec}>{el}</Chip></div>
              ))}
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
    </>
  )
}

export default QualificationView
