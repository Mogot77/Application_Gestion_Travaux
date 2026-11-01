import { useState, type CSSProperties } from 'react'
import type { DocsEntreprise } from '@/types'
import Icon from '@/components/ui/Icon'
import Chip from '@/components/ui/Chip'
import Opts from '@/components/ui/Opts'
import Photo from '@/components/Photo'
import { useApp } from '@/hooks/useApp'
import { go } from '@/hooks/useRoute'
import { useUiState } from '@/hooks/useUiState'
import { entDocs, getCs, getD, getEnt, getLog, hist, shortLot } from '@/helpers/domain'
import { TODAY, addDays, diffDays, fd, fday, fdayLong, feur, ftime, now } from '@/helpers/dates'
import { DOC_NAMES } from './constants'
import type { PortalProps, PortalDraft } from './types'

/** Portail externe des entreprises consultées (démonstration) : consultation du dossier, visite, question, dépôt du devis. */
const Portal = ({ csId, eid: eidParam }: PortalProps) => {
  const { S, mutate, toast, openModal } = useApp()
  const c = getCs(S, csId)
  const eid = eidParam || c?.entreprises[0] || ''
  const [question, setQuestion] = useState('')
  const [p, setP] = useUiState<PortalDraft>(`portal:${csId}:${eid}`, {
    montantHT: '', tva: '10', delai: '', duree: '', validite: '3', postes: c ? c.lignes.slice() : [], pdf: '', slot: '',
  })

  if (!c) return <main className="main mx-auto max-w-[1440px] p-6"><div className="card pad empty">Lien de consultation invalide ou expiré.</div></main>
  const e = getEnt(S, eid)
  const d = getD(S, c.demandeId)
  const log = getLog(S, d?.logementId)
  if (!e || !d || !log) return <main className="main mx-auto max-w-[1440px] p-6"><div className="card pad empty">Lien de consultation invalide ou expiré.</div></main>
  const r = c.reponses[eid] || { statut: 'attente' as const }
  const closed = c.statut === 'commande' || diffDays(c.dateLimite, TODAY) > 0
  const dc = entDocs(e)
  const photos = c.lignes.flatMap(i => d.lignes[i].photos)
  const lotsLabel = c.lignes.map(i => shortLot(d.lignes[i].lot)).filter((v, i, a) => a.indexOf(v) === i).join(' et ')

  const upd = (fn: (x: NonNullable<ReturnType<typeof getCs>>) => void) => mutate(s => { const x = getCs(s, c.id); if (x) fn(x) }, { now: true })

  const chooseSlot = (slot: string) => {
    setP({ slot })
    upd(x => {
      x.reponses[eid] = x.reponses[eid] || { statut: 'attente' }
      x.reponses[eid].slot = slot
      hist(x, `Visite réservée par ${e.nom} · ${fday(slot)} ${ftime(slot)}`)
    })
    toast('Créneau de visite réservé', 'ok')
  }
  const ask = () => {
    const v = question.trim()
    if (!v) return
    upd(x => { x.questions.push({ q: v, a: '', at: now() }); hist(x, 'Question posée sur le portail') })
    toast('Question envoyée à la coordination', 'ok')
    setQuestion('')
  }
  const depot = () => {
    const m = Number(p.montantHT), dl = Number(p.delai), du = Number(p.duree)
    if (!p.pdf) return toast('Joignez le devis PDF', 'err')
    if (!(m > 0) || !(dl > 0) || !(du > 0)) return toast('Montant, délai et durée sont obligatoires', 'err')
    if (!p.postes.length) return toast('Indiquez les postes chiffrés', 'err')
    upd(x => {
      const prev = x.reponses[eid] || { statut: 'attente' as const }
      x.reponses[eid] = {
        statut: 'recu', date: TODAY, montantHT: m, tva: Number(p.tva), delai: dl, duree: du, validite: Number(p.validite) || 1,
        postes: p.postes.slice().sort(), pdf: p.pdf, visite: prev.slot && prev.slot.slice(0, 10) <= TODAY ? prev.slot.slice(0, 10) : '', slot: prev.slot, qualite: null,
      }
      hist(x, `Devis reçu · ${e.nom}`)
    })
    toast('Devis déposé, merci !', 'ok')
  }
  const decline = () => openModal({
    title: 'Décliner la consultation', okLabel: 'Décliner', danger: true,
    body: <div><label className="lbl">Motif</label><select className="in" name="m"><Opts list={['Plan de charge', 'Hors de nos compétences', 'Secteur trop éloigné', 'Autre']} /></select></div>,
    onOk(fd) {
      const m = String(fd.get('m'))
      upd(x => { x.reponses[eid] = { statut: 'decline', date: TODAY, motif: m }; hist(x, `${e.nom} décline : ${m.toLowerCase()}`) })
    },
  })
  const updateDoc = (k: keyof DocsEntreprise) => {
    const isExp = k === 'rc' || k === 'decennale'
    openModal({
      title: 'Mettre à jour le document', okLabel: 'Enregistrer',
      body: (
        <>
          <div><label className="lbl">{isExp ? "Date de fin de validité de l'attestation" : 'Date de délivrance du document'}</label><input className="in" type="date" name="d" defaultValue={isExp ? addDays(TODAY, 365) : TODAY} /></div>
          <div><label className="lbl">Fichier PDF</label><input type="file" accept="application/pdf" /></div>
        </>
      ),
      onOk(fd) {
        const v = String(fd.get('d'))
        mutate(s => { const x = getEnt(s, eid); if (x) x.docs[k] = v }, { now: true })
        toast('Document mis à jour', 'ok')
      },
    })
  }

  return (
    <>
      <header className="noprint sticky top-0 z-20 flex flex-wrap items-center gap-x-5 gap-y-2 bg-[#0F3D3A] px-4 sm:px-6">
        <span className="py-4 text-[17px] font-bold text-white">Equalis · Portail entreprises</span>
        <span className="flex-1"></span>
        <div className="flex flex-wrap items-center gap-3 py-2"><span className="text-[13px] text-[#d1d5db]">Connecté :</span>
          <select className="h-8 max-w-[220px] rounded-lg border border-[#4b5563] bg-[#374151] px-2 text-[13px] font-medium text-[#e5e7eb]" aria-label="Entreprise (démonstration)" value={eid} onChange={ev => go(`#/portail/${c.id}/${ev.target.value}`)}>
            <Opts list={c.entreprises.map(x => ({ v: x, l: getEnt(S, x)?.nom || x }))} />
          </select>
          <a className="text-[13px] text-[#d1d5db] no-underline hover:text-white" href={`#/devis/${c.id}`}>← Retour Equalis</a></div>
      </header>
      <main className="main mx-auto max-w-[1440px] p-4 sm:p-6">
        <div className="pagehead items-start">
          <div><div className="muted s13">Consultation {c.id}</div>
            <h1 className="mb-2 mt-1">{lotsLabel} · {log.ville} ({log.dept})</h1>
            <div className="row !gap-2.5"><Chip tone={closed ? 'gr' : 'h48'}>{`Réponse attendue avant le ${fday(c.dateLimite)} · ${c.heureLimite}`}</Chip><span className="muted s13">Logement {log.typo} occupé · adresse précise communiquée à la visite</span></div></div>
          {r.statut === 'attente' && !closed && <button className="btn" onClick={decline}>Décliner la consultation</button>}
        </div>
        {r.statut === 'recu' && <div className="note mb-4 !border-good-line !bg-good-soft">Devis déposé le {fd(r.date)} : {feur(r.montantHT)} HT. Merci, la coordination vous informera de sa décision.</div>}
        {r.statut === 'decline' && <div className="note mb-4">Vous avez décliné cette consultation ({r.motif || ''}).</div>}
        {c.statut === 'commande' && <div className="note info mb-4">Consultation close : {c.decision?.entrepriseId === eid ? 'votre devis a été retenu, le bon de commande vous a été envoyé.' : "votre devis n'a pas été retenu. Merci de votre participation."}</div>}
        <div className="cols">
          <div className="col-main">
            <section className="card pad"><h2 className="h2 mb-3">Travaux demandés</h2>
              <ol className="m-0 flex list-decimal flex-col gap-1.5 pl-5 text-sm">{c.lignes.map(i => { const l = d.lignes[i]; return <li key={i}><strong>{l.piece}</strong> — {l.nature.toLowerCase()} ({shortLot(l.lot).toLowerCase()}), {l.description}</li> })}</ol>
              <p className="muted s13">{c.descriptif}{c.descriptif ? '. ' : ''}Intervention souhaitée : {c.delai.toLowerCase()}.</p>
              <div className="row !gap-2">{photos.map((ph, i) => <Photo key={i} src={ph} />)}</div>
              <div className="doc mt-3 !border-0"><Chip tone="ko">PDF</Chip><span className="flex-1">Fiche travaux {c.id}</span><a href={`#/fiche/${d.id}`}>Télécharger</a></div>
            </section>
            {c.visite && (
              <section className="card pad"><h2 className="h2 mb-3">Visite sur place</h2>
                <div className="stack" style={{ '--gap': '8px' } as CSSProperties}>{c.creneaux.map(cr => (
                  <label key={cr} className="slot"><input type="radio" name="slot" value={cr} checked={(r.slot || p.slot) === cr} disabled={closed} onChange={() => chooseSlot(cr)} /> {fdayLong(cr)} · {ftime(cr).replace(':', 'h')}</label>
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
                  <label className="drop"><Icon name="upload" /><span>{p.pdf ? p.pdf : 'Glisser le devis PDF ici ou cliquer'}</span><input type="file" accept="application/pdf" onChange={ev => { const f = ev.target.files?.[0]; if (f) setP({ pdf: f.name }) }} /></label>
                  <div className="grid-auto" style={{ '--min': '130px' } as CSSProperties}>
                    <div><label className="lbl" htmlFor="ptm">Montant HT (€)</label><input className="in" id="ptm" type="number" min={0} step={10} value={p.montantHT} onChange={ev => setP({ montantHT: ev.target.value })} /></div>
                    <div><label className="lbl" htmlFor="ptt">Taux de TVA</label><select className="in" id="ptt" value={p.tva} onChange={ev => setP({ tva: ev.target.value })}><Opts list={[{ v: '5.5', l: '5,5 %' }, { v: '10', l: '10 %' }, { v: '20', l: '20 %' }]} /></select></div>
                    <div><label className="lbl" htmlFor="ptd">Délai d'intervention (j)</label><input className="in" id="ptd" type="number" min={1} value={p.delai} onChange={ev => setP({ delai: ev.target.value })} /></div>
                    <div><label className="lbl" htmlFor="ptu">Durée des travaux (j)</label><input className="in" id="ptu" type="number" min={1} value={p.duree} onChange={ev => setP({ duree: ev.target.value })} /></div>
                    <div><label className="lbl" htmlFor="ptv">Validité (mois)</label><input className="in" id="ptv" type="number" min={1} value={p.validite} onChange={ev => setP({ validite: ev.target.value })} /></div>
                  </div>
                  <div><span className="lbl">Postes chiffrés</span>{c.lignes.map(i => (
                    <label key={i} className="chkrow !text-[13px]"><input type="checkbox" checked={p.postes.includes(i)} onChange={ev => setP({ postes: ev.target.checked ? [...new Set([...p.postes, i])] : p.postes.filter(x => x !== i) })} /> {d.lignes[i].piece} · {d.lignes[i].nature}</label>
                  ))}</div>
                  <button className="btn btnp btn-w" onClick={depot}>Déposer le devis</button>
                </div></section>
            )}
            <section className="card pad"><h2 className="h2 mb-2">Documents de l'entreprise</h2>
              {DOC_NAMES.map(([k, l]) => {
                const ok = dc.st[k]
                const exp = k === 'rc' || k === 'decennale' ? e.docs[k] : addDays(e.docs[k], k === 'kbis' ? 92 : 182)
                const soon = ok && diffDays(TODAY, exp) < 70
                return (
                  <div key={k} className="doc"><span>{l}</span><span className="row flex-nowrap !gap-2"><Chip tone={!ok ? 'ko' : soon ? 'wa' : 'ok'}>{!ok ? 'Expiré' : soon ? 'Expire le ' + fd(exp) : 'À jour'}</Chip><button className="linkbtn small" onClick={() => updateDoc(k)}>Mettre à jour</button></span></div>
                )
              })}
              {!dc.ok && <p className="small mb-0 mt-2.5 text-danger">Documents à mettre à jour : sans eux, votre devis ne pourra pas être retenu.</p>}
            </section>
          </aside>
        </div>
      </main>
    </>
  )
}

export default Portal
