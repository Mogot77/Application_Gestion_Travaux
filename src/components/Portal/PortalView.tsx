import { useState, type CSSProperties } from 'react'
import Icon from '@/components/ui/Icon'
import Chip from '@/components/ui/Chip'
import Opts from '@/components/ui/Opts'
import PhotoView from '@/components/Photo/PhotoView'
import { fd, fday, fdayLong, feur, ftime } from '@/helpers/dates'
import { shortLot } from '@/helpers/domain'
import type { PortalViewProps } from './types'

/** Portail externe des entreprises consultées (présentation seule) : dossier, visite, question, dépôt du devis. */
const PortalView = ({ model, draft: p, onDraft, onChooseSlot, onAsk, onDeposit, onDecline, onUpdateDoc, onSwitchEnt, onOpenPhoto }: PortalViewProps) => {
  const [question, setQuestion] = useState('')

  if (!model) return <main className="main mx-auto max-w-[1440px] p-6"><div className="card pad empty">Lien de consultation invalide ou expiré.</div></main>
  const { c, d, log, eid, r, closed, docsOk, docRows, photos, lotsLabel, entOptions } = model

  const ask = () => {
    const v = question.trim()
    if (!v) return
    onAsk(v)
    setQuestion('')
  }

  return (
    <>
      <header className="noprint sticky top-0 z-20 flex flex-wrap items-center gap-x-5 gap-y-2 bg-[#0F3D3A] px-4 sm:px-6">
        <span className="py-4 text-[17px] font-bold text-white">Equalis · Portail entreprises</span>
        <span className="flex-1"></span>
        <div className="flex flex-wrap items-center gap-3 py-2"><span className="text-[13px] text-[#d1d5db]">Connecté :</span>
          <select className="h-8 max-w-[220px] rounded-lg border border-[#4b5563] bg-[#374151] px-2 text-[13px] font-medium text-[#e5e7eb]" aria-label="Entreprise (démonstration)" value={eid} onChange={ev => onSwitchEnt(ev.target.value)}>
            <Opts list={entOptions} />
          </select>
          <a className="text-[13px] text-[#d1d5db] no-underline hover:text-white" href={`#/devis/${c.id}`}>← Retour Equalis</a></div>
      </header>
      <main className="main mx-auto max-w-[1440px] p-4 sm:p-6">
        <div className="pagehead items-start">
          <div><div className="muted s13">Consultation {c.id}</div>
            <h1 className="mb-2 mt-1">{lotsLabel} · {log.ville} ({log.dept})</h1>
            <div className="row !gap-2.5"><Chip tone={closed ? 'gr' : 'h48'}>{`Réponse attendue avant le ${fday(c.dateLimite)} · ${c.heureLimite}`}</Chip><span className="muted s13">Logement {log.typo} occupé · adresse précise communiquée à la visite</span></div></div>
          {r.statut === 'attente' && !closed && <button className="btn" onClick={onDecline}>Décliner la consultation</button>}
        </div>
        {r.statut === 'recu' && <div className="note mb-4 !border-good-line !bg-good-soft">Devis déposé le {fd(r.date)} : {feur(r.montantHT)} HT. Merci, la coordination vous informera de sa décision.</div>}
        {r.statut === 'decline' && <div className="note mb-4">Vous avez décliné cette consultation ({r.motif || ''}).</div>}
        {c.statut === 'commande' && <div className="note info mb-4">Consultation close : {c.decision?.entrepriseId === eid ? 'votre devis a été retenu, le bon de commande vous a été envoyé.' : "votre devis n'a pas été retenu. Merci de votre participation."}</div>}
        <div className="cols">
          <div className="col-main">
            <section className="card pad"><h2 className="h2 mb-3">Travaux demandés</h2>
              <ol className="m-0 flex list-decimal flex-col gap-1.5 pl-5 text-sm">{c.lignes.map(i => { const l = d.lignes[i]; return <li key={i}><strong>{l.piece}</strong> — {l.nature.toLowerCase()} ({shortLot(l.lot).toLowerCase()}), {l.description}</li> })}</ol>
              <p className="muted s13">{c.descriptif}{c.descriptif ? '. ' : ''}Intervention souhaitée : {c.delai.toLowerCase()}.</p>
              <div className="row !gap-2">{photos.map((ph, i) => <PhotoView key={i} src={ph} onOpen={onOpenPhoto} />)}</div>
              <div className="doc mt-3 !border-0"><Chip tone="ko">PDF</Chip><span className="flex-1">Fiche travaux {c.id}</span><a href={`#/fiche/${d.id}`}>Télécharger</a></div>
            </section>
            {c.visite && (
              <section className="card pad"><h2 className="h2 mb-3">Visite sur place</h2>
                <div className="stack" style={{ '--gap': '8px' } as CSSProperties}>{c.creneaux.map(cr => (
                  <label key={cr} className="slot"><input type="radio" name="slot" value={cr} checked={(r.slot || p.slot) === cr} disabled={closed} onChange={() => onChooseSlot(cr)} /> {fdayLong(cr)} · {ftime(cr).replace(':', 'h')}</label>
                ))}</div>
                <p className="muted s13 mb-0 mt-2.5">Le créneau choisi est ajouté au planning de la coordination ; l'adresse et le contact sur place vous sont envoyés.</p></section>
            )}
            <section className="card pad"><h2 className="h2 mb-2.5">Une question ?</h2>
              {c.questions.map((q, i) => <div key={i} className="qa"><strong>{q.q}</strong><div className="muted">{q.a ? q.a : 'En attente de réponse'}</div></div>)}
              {!closed && <div className="row mt-2 flex-nowrap !gap-2"><input className="in" placeholder="Votre question à la coordination" value={question} onChange={ev => setQuestion(ev.target.value)} /><button className="btn" onClick={ask}>Envoyer</button></div>}
              <p className="muted s13 mb-0 mt-2.5">Questions et réponses partagées avec toutes les entreprises consultées, sans nommer l'auteur.</p></section>
          </div>
          <aside className="col-side">
            {r.statut === 'attente' && !closed && (
              <section className="card pad"><h2 className="h2 mb-3">Déposer votre devis</h2>
                <div className="stack" style={{ '--gap': '12px' } as CSSProperties}>
                  <label className="drop"><Icon name="upload" /><span>{p.pdf ? p.pdf : 'Glisser le devis PDF ici ou cliquer'}</span><input type="file" accept="application/pdf" onChange={ev => { const f = ev.target.files?.[0]; if (f) onDraft({ pdf: f.name }) }} /></label>
                  <div className="grid-auto" style={{ '--min': '130px' } as CSSProperties}>
                    <div><label className="lbl" htmlFor="ptm">Montant HT (€)</label><input className="in" id="ptm" type="number" min={0} step={10} value={p.montantHT} onChange={ev => onDraft({ montantHT: ev.target.value })} /></div>
                    <div><label className="lbl" htmlFor="ptt">Taux de TVA</label><select className="in" id="ptt" value={p.tva} onChange={ev => onDraft({ tva: ev.target.value })}><Opts list={[{ v: '5.5', l: '5,5 %' }, { v: '10', l: '10 %' }, { v: '20', l: '20 %' }]} /></select></div>
                    <div><label className="lbl" htmlFor="ptd">Délai d'intervention (j)</label><input className="in" id="ptd" type="number" min={1} value={p.delai} onChange={ev => onDraft({ delai: ev.target.value })} /></div>
                    <div><label className="lbl" htmlFor="ptu">Durée des travaux (j)</label><input className="in" id="ptu" type="number" min={1} value={p.duree} onChange={ev => onDraft({ duree: ev.target.value })} /></div>
                    <div><label className="lbl" htmlFor="ptv">Validité (mois)</label><input className="in" id="ptv" type="number" min={1} value={p.validite} onChange={ev => onDraft({ validite: ev.target.value })} /></div>
                  </div>
                  <div><span className="lbl">Postes chiffrés</span>{c.lignes.map(i => (
                    <label key={i} className="chkrow !text-[13px]"><input type="checkbox" checked={p.postes.includes(i)} onChange={ev => onDraft({ postes: ev.target.checked ? [...new Set([...p.postes, i])] : p.postes.filter(x => x !== i) })} /> {d.lignes[i].piece} · {d.lignes[i].nature}</label>
                  ))}</div>
                  <button className="btn btnp btn-w" onClick={onDeposit}>Déposer le devis</button>
                </div></section>
            )}
            <section className="card pad"><h2 className="h2 mb-2">Documents de l'entreprise</h2>
              {docRows.map(({ k, label, status, exp }) => (
                <div key={k} className="doc"><span>{label}</span><span className="row flex-nowrap !gap-2"><Chip tone={status === 'expired' ? 'ko' : status === 'soon' ? 'wa' : 'ok'}>{status === 'expired' ? 'Expiré' : status === 'soon' ? 'Expire le ' + fd(exp) : 'À jour'}</Chip><button className="linkbtn small" onClick={() => onUpdateDoc(k)}>Mettre à jour</button></span></div>
              ))}
              {!docsOk && <p className="small mb-0 mt-2.5 text-danger">Documents à mettre à jour : sans eux, votre devis ne pourra pas être retenu.</p>}
            </section>
          </aside>
        </div>
      </main>
    </>
  )
}

export default PortalView
