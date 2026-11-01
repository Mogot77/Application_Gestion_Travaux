import type { CSSProperties } from 'react'
import Chip from '@/components/ui/Chip'
import Empty from '@/components/ui/Empty'
import Seg from '@/components/ui/Seg'
import PhotoView from '@/components/Photo/PhotoView'
import StepHeader from '@/components/ui/StepHeader'
import Crumb from '@/components/ui/Crumb'
import { entDocs, lineLabel, shortLot } from '@/helpers/domain'
import { TODAY, feur, fnum } from '@/helpers/dates'
import { CRITERES, MODES } from './constants'
import type { ConsultationViewProps } from './types'

/** Formulaire de consultation d'entreprises (présentation seule) : mode d'achat, postes, entreprises et conditions. */
const ConsultationView = ({ model, error, onSaveDraft, onSend, onSetMode, onField, onToggleLine, onAddEnt, onRemoveEnt, onVisite, onCreneau, onCritere, onOpenPhoto }: ConsultationViewProps) => {
  if (!model) return <div className="card pad empty">{error}</div>
  const { c, d, log, lots, shown, sumCrit, nph, sendLabel, warn3, seuilTroisDevis, seuilDirection } = model
  const crit = c.criteres

  return (
    <>
      <Crumb items={[{ label: 'Demandes', href: '#/demandes' }, { label: d.id, href: `#/demande/${d.id}` }, { label: 'Consultation' }]} />
      <div className="pagehead">
        <div className="t"><h1>Consulter des entreprises</h1><Chip tone="rx">Circuit prestataire</Chip><span className="muted s13">{d.id} · {log?.id} · {log?.typo} · {log?.ville} ({log?.dept})</span></div>
        <div className="row !gap-2"><button className="btn" onClick={onSaveDraft}>Enregistrer le brouillon</button><button className="btn btnp" onClick={onSend}>{sendLabel}</button></div>
      </div>
      <div className="cols">
        <div className="col-main">
          <section className="card pad">
            <StepHeader step={1} title="Mode d'achat" />
            <div className="seg tall">{MODES.map(([k, l, s]) => <button key={k} type="button" className={c.mode === k ? 'on' : ''} onClick={() => onSetMode(k)}><strong>{l}</strong><small>{s}</small></button>)}</div>
            {c.mode === 'unique' && <div className="mt-3"><label className="lbl" htmlFor="csmu">Motif du recours à une entreprise unique (obligatoire)</label><input className="in" id="csmu" value={c.motifUnique} placeholder="Urgence, montant faible, spécialité…" onChange={e => onField('motifUnique', e.target.value)} /></div>}
            <p className="muted small mb-0 mt-3">Règle interne : au-delà de {feur(seuilTroisDevis)} HT, au moins 3 devis ; au-delà de {feur(seuilDirection)} HT, validation de la direction (seuils réglables dans les référentiels). Hors lots couverts par l'accord-cadre.</p>
          </section>
          <section className="card pad">
            <StepHeader step={2} title="Travaux à chiffrer" />
            <div className="stack" style={{ '--gap': '8px' } as CSSProperties}>
              {d.lignes.map((l, i) => (
                <label key={i} className="li-chk"><input type="checkbox" checked={c.lignes.includes(i)} onChange={e => onToggleLine(i, e.target.checked)} /><PhotoView src={l.photos[0]} w={56} h={42} onOpen={onOpenPhoto} />
                  <div><strong className="s13">{i + 1} · {lineLabel(l)}</strong><div className="muted small">{l.description} · {l.photos.length} photo(s)</div></div></label>
              ))}
            </div>
            <div className="grid-auto mt-3.5" style={{ '--min': '260px' } as CSSProperties}>
              <div><label className="lbl" htmlFor="csdesc">Descriptif complémentaire</label><textarea className="in" id="csdesc" value={c.descriptif} placeholder="Finitions, contraintes, matériaux" onChange={e => onField('descriptif', e.target.value)} /></div>
              <div><span className="lbl">Pièces jointes automatiques</span><div className="in ro">Fiche travaux PDF + {nph} photo{nph > 1 ? 's' : ''}</div>
                <label className="lbl mt-2.5" htmlFor="csest">Estimation interne (€ HT)</label><input className="in" id="csest" type="number" min={0} value={c.estimation} placeholder="facultatif" onChange={e => onField('estimation', e.target.value)} /></div>
            </div>
          </section>
          <section className="card pad">
            <div className="row between mb-3"><StepHeader step={3} title="Entreprises consultées" className="!m-0" />
              <div className="row !gap-1.5"><Chip>Lot : {lots.map(shortLot).join(', ')}</Chip><Chip>Secteur : {log?.secteur}</Chip><button className="btn btn-sm" onClick={onAddEnt}>+ Ajouter une entreprise</button></div></div>
            <div className="ent hd"><span></span><span>Entreprise</span><span>Documents</span><span>Historique</span><span>Note moyenne</span><span></span></div>
            {shown.map(e => {
              const dc = entDocs(e)
              return (
                <div key={e.id} className="ent"><span></span>
                  <div><strong>{e.nom}</strong>{e.accordCadre && <> <Chip tone="bl">Accord-cadre</Chip></>}<small>{e.ville} · {e.activite}</small></div>
                  <span><Chip tone={dc.ok ? 'ok' : 'ko'}>{dc.label}</Chip></span><span>{e.chantiers} chantier{e.chantiers > 1 ? 's' : ''}</span><span>{fnum(e.note, 1)} / 5</span>
                  <button className="linkbtn" aria-label={`Retirer ${e.nom}`} onClick={() => onRemoveEnt(e.id)}>×</button></div>
              )
            })}
            {!shown.length && <Empty>Aucune entreprise sélectionnée</Empty>}
            {warn3 && <div className="note warn mt-2.5">Estimation au-delà de {feur(seuilTroisDevis)} HT : consulter au moins 3 entreprises.</div>}
            <p className="muted small mb-0 mt-3">Documents suivis : Kbis de moins de 3 mois, attestation URSSAF de moins de 6 mois, assurances RC et décennale. Une entreprise sans documents à jour peut être consultée, mais pas retenue.</p>
          </section>
        </div>
        <aside className="col-side">
          <section className="card pad">
            <StepHeader step={4} title="Conditions" />
            <div className="stack" style={{ '--gap': '14px' } as CSSProperties}>
              <div><span className="lbl">Date limite de remise des devis</span><div className="grid grid-cols-[1fr_100px] gap-2"><input className="in" type="date" id="csdl" value={c.dateLimite} min={TODAY} onChange={e => onField('dateLimite', e.target.value)} /><input className="in" type="time" id="cshl" value={c.heureLimite} onChange={e => onField('heureLimite', e.target.value)} /></div></div>
              <div><span className="lbl">Visite sur place</span><Seg values={[{ k: '1', l: 'Proposée' }, { k: '0', l: 'Sans visite' }]} sel={c.visite ? '1' : '0'} onPick={v => onVisite(v === '1')} />
                {c.visite && <div className="stack mt-2" style={{ '--gap': '6px' } as CSSProperties}>{c.creneaux.map((cr, i) => <input key={i} className="in sm" type="datetime-local" value={cr} onChange={e => onCreneau(i, e.target.value)} />)}</div>}</div>
              <div><label className="lbl" htmlFor="csdel">Délai d'intervention souhaité</label><input className="in" id="csdel" value={c.delai} onChange={e => onField('delai', e.target.value)} /></div>
              <div><span className="lbl">Critères de choix annoncés {sumCrit !== 100 && <span className="text-danger">(total {sumCrit} %)</span>}</span>
                {CRITERES.map(([k, l]) => (
                  <div key={k} className="row between s13 flex-nowrap border-b border-line2 py-1.5"><span>{l}</span>
                    <span className="row flex-nowrap !gap-1"><input className="in sm !min-h-[30px] !w-16" type="number" min={0} max={100} value={crit[k]} onChange={e => onCritere(k, e.target.value)} /> %</span></div>
                ))}</div>
              <div><label className="lbl" htmlFor="csmsg">Message aux entreprises</label><textarea className="in" id="csmsg" value={c.message} onChange={e => onField('message', e.target.value)} /></div>
            </div>
          </section>
          <section className="card pad s13 leading-normal">
            <strong>À l'envoi</strong>
            <p className="my-1.5">Chaque entreprise reçoit un mail avec un lien personnel vers le portail entreprise : fiche, photos, créneaux de visite et dépôt du devis.</p>
            <p className="m-0">Relance automatique 2 jours avant la date limite.</p>
          </section>
        </aside>
      </div>
    </>
  )
}

export default ConsultationView
