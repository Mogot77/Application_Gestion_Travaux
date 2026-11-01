import { useEffect, type CSSProperties } from 'react'
import type { Consultation as Cs } from '@/types'
import Chip from '@/components/ui/Chip'
import Empty from '@/components/ui/Empty'
import Opts from '@/components/ui/Opts'
import Seg from '@/components/ui/Seg'
import Layout from '@/components/Layout'
import Photo from '@/components/Photo'
import { useApp } from '@/hooks/useApp'
import { go, replace } from '@/hooks/useRoute'
import { entDocs, getCs, getD, getEnt, getLog, hist, lineLabel, nextId, shortLot } from '@/helpers/domain'
import { TODAY, fd, feur, fnum, now } from '@/helpers/dates'
import { draftOf, newDraft } from './helpers'
import type { ConsultationProps, TextField } from './types'
import StepHeader from '@/components/ui/StepHeader'
import Crumb from '@/components/ui/Crumb'

const Consultation = ({ id }: ConsultationProps) => {
  const { S, mutate, toast, openModal } = useApp()
  const d = getD(S, id)
  const existing = d?.consultationId && getCs(S, d.consultationId)
  const c = d ? draftOf(S, d.id) : undefined

  useEffect(() => {
    if (existing && d?.consultationId) replace('#/devis/' + d.consultationId)
  }, [existing, d?.consultationId])
  useEffect(() => {
    if (d && !existing && !c) mutate(s => { const x = getD(s, d.id); if (x) s.consultations.push(newDraft(s, x)) })
  }, [d, existing, c, mutate])

  if (!d) return <Layout active="demandes"><div className="card pad empty">Demande introuvable</div></Layout>
  if (existing || !c) return <Layout active="demandes" />

  const log = getLog(S, d.logementId)
  const upd = (fn: (x: Cs) => void, persistNow = false) => mutate(s => { const x = draftOf(s, d.id); if (x) fn(x) }, { now: persistNow })
  const setField = (k: TextField, v: string) => upd(x => { x[k] = v })
  const lots = [...new Set(c.lignes.map(i => d.lignes[i].lot))]
  const shown = S.entreprises.filter(e => c.entreprises.includes(e.id))
  const crit = c.criteres
  const sumCrit = crit.prix + crit.delai + crit.qualite
  const nph = c.lignes.reduce((s, i) => s + d.lignes[i].photos.length, 0)
  const modes: ['accord' | 'devis' | 'unique', string, string][] = [
    ['accord', 'Bon de commande accord-cadre', 'Titulaire du lot désigné selon les règles du marché'],
    ['devis', 'Mise en concurrence par devis', 'Plusieurs entreprises consultées, choix motivé'],
    ['unique', 'Entreprise unique', 'Urgence ou montant faible, motif obligatoire'],
  ]
  const sendLabel = c.mode === 'accord' ? 'Émettre le bon de commande' : `Envoyer la consultation (${c.entreprises.length})`
  const est = Number(c.estimation) || 0
  const warn3 = c.mode === 'devis' && est > S.ref.seuils.troisDevis && c.entreprises.length < 3

  const setMode = (mode: Cs['mode']) => {
    const t = S.entreprises.find(e => e.accordCadre && e.lots.some(l => d.lignes.map(x => x.lot).includes(l)))
    upd(x => {
      x.mode = mode
      if (mode === 'accord') x.entreprises = t ? [t.id] : x.entreprises.slice(0, 1)
      if (mode === 'unique') x.entreprises = x.entreprises.slice(0, 1)
    })
    if (mode === 'accord' && !t) toast("Aucun titulaire d'accord-cadre pour ce lot", 'err')
  }
  const toggleLine = (i: number, on: boolean) => upd(x => { x.lignes = on ? [...new Set([...x.lignes, i])].sort() : x.lignes.filter(v => v !== i) })
  const addEnt = () => {
    const others = S.entreprises.filter(e => !c.entreprises.includes(e.id))
    if (!others.length) return toast('Toutes les entreprises sont déjà consultées')
    openModal({
      title: 'Ajouter une entreprise', okLabel: 'Ajouter',
      body: <div><label className="lbl">Entreprise référencée</label><select className="in" name="e"><Opts list={others.map(e => ({ v: e.id, l: `${e.nom} — ${e.ville} · ${e.activite}` }))} /></select></div>,
      onOk(fd) { upd(x => { if (x.mode !== 'devis') x.entreprises = []; x.entreprises.push(String(fd.get('e'))) }) },
    })
  }
  const send = () => {
    if (!c.lignes.length) return toast('Sélectionnez au moins un poste à chiffrer', 'err')
    if (!c.entreprises.length) return toast('Sélectionnez au moins une entreprise', 'err')
    if (c.mode === 'unique' && !c.motifUnique.trim()) return toast('Motif obligatoire pour une entreprise unique', 'err')
    if (sumCrit !== 100) return toast('Les critères doivent totaliser 100 %', 'err')
    let csId = ''
    let msg = ''
    mutate(s => {
      const x = draftOf(s, d.id); const dm = getD(s, d.id)
      if (!x || !dm) return
      x.id = nextId(s, 'cs'); x.statut = 'envoyee'; x.envoyeeLe = now()
      x.entreprises.forEach(e => { x.reponses[e] = { statut: 'attente' } })
      dm.consultationId = x.id
      dm.lignes.forEach((l, i) => { if (x.lignes.includes(i)) l.circuit = 'prestataire' })
      csId = x.id
      if (x.mode === 'accord') {
        const e = getEnt(s, x.entreprises[0]); const bc = nextId(s, 'bc')
        if (!e) return
        x.statut = 'commande'
        x.decision = { entrepriseId: e.id, motif: "Titulaire de l'accord-cadre", imputation: dm.lignes[x.lignes[0]].imputation, statut: 'validee', bc, at: now() }
        hist(x, `Bon de commande ${bc} émis · ${e.nom} (accord-cadre)`)
        dm.statut = 'prestataire'; hist(dm, `Bon de commande accord-cadre ${bc} envoyé à ${e.nom}`)
        msg = `Bon de commande ${bc} émis`
        return
      }
      hist(x, `Consultation envoyée à ${x.entreprises.length} entreprise${x.entreprises.length > 1 ? 's' : ''}`)
      dm.statut = 'consultation'; hist(dm, `Consultation ${x.id} envoyée à ${x.entreprises.length} entreprise(s) · réponses avant le ${fd(x.dateLimite)}`)
      msg = `Consultation ${x.id} envoyée`
    }, { now: true })
    toast(msg, 'ok')
    go('#/devis/' + csId)
  }

  return (
    <Layout active="demandes">
      <Crumb items={[{ label: 'Demandes', href: '#/demandes' }, { label: d.id, href: `#/demande/${d.id}` }, { label: 'Consultation' }]} />
      <div className="pagehead">
        <div className="t"><h1>Consulter des entreprises</h1><Chip tone="rx">Circuit prestataire</Chip><span className="muted s13">{d.id} · {log?.id} · {log?.typo} · {log?.ville} ({log?.dept})</span></div>
        <div className="row !gap-2"><button className="btn" onClick={() => { mutate(() => { /* persiste l'état courant */ }, { now: true }); toast('Brouillon de consultation enregistré', 'ok') }}>Enregistrer le brouillon</button><button className="btn btnp" onClick={send}>{sendLabel}</button></div>
      </div>
      <div className="cols">
        <div className="col-main">
          <section className="card pad">
            <StepHeader step={1} title="Mode d'achat" />
            <div className="seg tall">{modes.map(([k, l, s]) => <button key={k} type="button" className={c.mode === k ? 'on' : ''} onClick={() => setMode(k)}><strong>{l}</strong><small>{s}</small></button>)}</div>
            {c.mode === 'unique' && <div className="mt-3"><label className="lbl" htmlFor="csmu">Motif du recours à une entreprise unique (obligatoire)</label><input className="in" id="csmu" value={c.motifUnique} placeholder="Urgence, montant faible, spécialité…" onChange={e => setField('motifUnique', e.target.value)} /></div>}
            <p className="muted small mb-0 mt-3">Règle interne : au-delà de {feur(S.ref.seuils.troisDevis)} HT, au moins 3 devis ; au-delà de {feur(S.ref.seuils.direction)} HT, validation de la direction (seuils réglables dans les référentiels). Hors lots couverts par l'accord-cadre.</p>
          </section>
          <section className="card pad">
            <StepHeader step={2} title="Travaux à chiffrer" />
            <div className="stack" style={{ '--gap': '8px' } as CSSProperties}>
              {d.lignes.map((l, i) => (
                <label key={i} className="li-chk"><input type="checkbox" checked={c.lignes.includes(i)} onChange={e => toggleLine(i, e.target.checked)} /><Photo src={l.photos[0]} w={56} h={42} />
                  <div><strong className="s13">{i + 1} · {lineLabel(l)}</strong><div className="muted small">{l.description} · {l.photos.length} photo(s)</div></div></label>
              ))}
            </div>
            <div className="grid-auto mt-3.5" style={{ '--min': '260px' } as CSSProperties}>
              <div><label className="lbl" htmlFor="csdesc">Descriptif complémentaire</label><textarea className="in" id="csdesc" value={c.descriptif} placeholder="Finitions, contraintes, matériaux" onChange={e => setField('descriptif', e.target.value)} /></div>
              <div><span className="lbl">Pièces jointes automatiques</span><div className="in ro">Fiche travaux PDF + {nph} photo{nph > 1 ? 's' : ''}</div>
                <label className="lbl mt-2.5" htmlFor="csest">Estimation interne (€ HT)</label><input className="in" id="csest" type="number" min={0} value={c.estimation} placeholder="facultatif" onChange={e => setField('estimation', e.target.value)} /></div>
            </div>
          </section>
          <section className="card pad">
            <div className="row between mb-3"><StepHeader step={3} title="Entreprises consultées" className="!m-0" />
              <div className="row !gap-1.5"><Chip>Lot : {lots.map(shortLot).join(', ')}</Chip><Chip>Secteur : {log?.secteur}</Chip><button className="btn btn-sm" onClick={addEnt}>+ Ajouter une entreprise</button></div></div>
            <div className="ent hd"><span></span><span>Entreprise</span><span>Documents</span><span>Historique</span><span>Note moyenne</span><span></span></div>
            {shown.map(e => {
              const dc = entDocs(e)
              return (
                <div key={e.id} className="ent"><span></span>
                  <div><strong>{e.nom}</strong>{e.accordCadre && <> <Chip tone="bl">Accord-cadre</Chip></>}<small>{e.ville} · {e.activite}</small></div>
                  <span><Chip tone={dc.ok ? 'ok' : 'ko'}>{dc.label}</Chip></span><span>{e.chantiers} chantier{e.chantiers > 1 ? 's' : ''}</span><span>{fnum(e.note, 1)} / 5</span>
                  <button className="linkbtn" aria-label={`Retirer ${e.nom}`} onClick={() => upd(x => { x.entreprises = x.entreprises.filter(v => v !== e.id) })}>×</button></div>
              )
            })}
            {!shown.length && <Empty>Aucune entreprise sélectionnée</Empty>}
            {warn3 && <div className="note warn mt-2.5">Estimation au-delà de {feur(S.ref.seuils.troisDevis)} HT : consulter au moins 3 entreprises.</div>}
            <p className="muted small mb-0 mt-3">Documents suivis : Kbis de moins de 3 mois, attestation URSSAF de moins de 6 mois, assurances RC et décennale. Une entreprise sans documents à jour peut être consultée, mais pas retenue.</p>
          </section>
        </div>
        <aside className="col-side">
          <section className="card pad">
            <StepHeader step={4} title="Conditions" />
            <div className="stack" style={{ '--gap': '14px' } as CSSProperties}>
              <div><span className="lbl">Date limite de remise des devis</span><div className="grid grid-cols-[1fr_100px] gap-2"><input className="in" type="date" id="csdl" value={c.dateLimite} min={TODAY} onChange={e => setField('dateLimite', e.target.value)} /><input className="in" type="time" id="cshl" value={c.heureLimite} onChange={e => setField('heureLimite', e.target.value)} /></div></div>
              <div><span className="lbl">Visite sur place</span><Seg values={[{ k: '1', l: 'Proposée' }, { k: '0', l: 'Sans visite' }]} sel={c.visite ? '1' : '0'} onPick={v => upd(x => { x.visite = v === '1' })} />
                {c.visite && <div className="stack mt-2" style={{ '--gap': '6px' } as CSSProperties}>{c.creneaux.map((cr, i) => <input key={i} className="in sm" type="datetime-local" value={cr} onChange={e => upd(x => { x.creneaux[i] = e.target.value })} />)}</div>}</div>
              <div><label className="lbl" htmlFor="csdel">Délai d'intervention souhaité</label><input className="in" id="csdel" value={c.delai} onChange={e => setField('delai', e.target.value)} /></div>
              <div><span className="lbl">Critères de choix annoncés {sumCrit !== 100 && <span className="text-danger">(total {sumCrit} %)</span>}</span>
                {([['prix', 'Prix'], ['delai', "Délai d'intervention"], ['qualite', 'Qualité et références']] as const).map(([k, l]) => (
                  <div key={k} className="row between s13 flex-nowrap border-b border-line2 py-1.5"><span>{l}</span>
                    <span className="row flex-nowrap !gap-1"><input className="in sm !min-h-[30px] !w-16" type="number" min={0} max={100} value={crit[k]} onChange={e => upd(x => { x.criteres[k] = Math.max(0, Number(e.target.value) || 0) })} /> %</span></div>
                ))}</div>
              <div><label className="lbl" htmlFor="csmsg">Message aux entreprises</label><textarea className="in" id="csmsg" value={c.message} onChange={e => setField('message', e.target.value)} /></div>
            </div>
          </section>
          <section className="card pad s13 leading-normal">
            <strong>À l'envoi</strong>
            <p className="my-1.5">Chaque entreprise reçoit un mail avec un lien personnel vers le portail entreprise : fiche, photos, créneaux de visite et dépôt du devis.</p>
            <p className="m-0">Relance automatique 2 jours avant la date limite.</p>
          </section>
        </aside>
      </div>
    </Layout>
  )
}

export default Consultation
