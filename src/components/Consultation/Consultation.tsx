import { useEffect } from 'react'
import type { Consultation as Cs } from '@/types'
import Opts from '@/components/ui/Opts'
import Layout from '@/components/Layout'
import { useApp } from '@/hooks/useApp'
import { go, replace } from '@/hooks/useRoute'
import { getCs, getD, getEnt, hist, nextId } from '@/helpers/domain'
import { fd, now } from '@/helpers/dates'
import { buildConsultationModel, draftOf, newDraft } from './helpers'
import type { ConsultationProps, CritereKey, TextField } from './types'
import { reserveIds } from '@/store/queries/counters'
import ConsultationView from './ConsultationView'

/** Conteneur du formulaire de consultation : brouillon dans le store, création, envoi et navigation. */
const Consultation = ({ id }: ConsultationProps) => {
  const { S, mutate, getS, toast, openModal } = useApp()
  const d = getD(S, id)
  const existing = d?.consultationId && getCs(S, d.consultationId)
  const c = d ? draftOf(S, d.id) : undefined

  useEffect(() => {
    if (existing && d?.consultationId) replace('#/devis/' + d.consultationId)
  }, [existing, d?.consultationId])
  useEffect(() => {
    if (d && !existing && !c) mutate(s => { const x = getD(s, d.id); if (x) s.consultations.push(newDraft(s, x)) })
  }, [d, existing, c, mutate])

  if (!d) return <Layout active="demandes"><ConsultationView model={null} error="Demande introuvable" onSaveDraft={() => {}} onSend={() => {}} onSetMode={() => {}} onField={() => {}} onToggleLine={() => {}} onAddEnt={() => {}} onRemoveEnt={() => {}} onVisite={() => {}} onCreneau={() => {}} onCritere={() => {}} onOpenPhoto={() => {}} /></Layout>
  if (existing || !c) return <Layout active="demandes" />

  const model = buildConsultationModel(S, d, c)
  const upd = (fn: (x: Cs) => void, persistNow = false) => mutate(s => { const x = draftOf(s, d.id); if (x) fn(x) }, { now: persistNow })

  const setMode = (mode: Cs['mode']) => {
    const t = S.entreprises.find(e => e.accordCadre && e.lots.some(l => d.lignes.map(x => x.lot).includes(l)))
    upd(x => {
      x.mode = mode
      if (mode === 'accord') x.entreprises = t ? [t.id] : x.entreprises.slice(0, 1)
      if (mode === 'unique') x.entreprises = x.entreprises.slice(0, 1)
    })
    if (mode === 'accord' && !t) toast("Aucun titulaire d'accord-cadre pour ce lot", 'err')
  }
  const addEnt = () => {
    const others = S.entreprises.filter(e => !c.entreprises.includes(e.id))
    if (!others.length) return toast('Toutes les entreprises sont déjà consultées')
    openModal({
      title: 'Ajouter une entreprise', okLabel: 'Ajouter',
      body: <div><label className="lbl">Entreprise référencée</label><select className="in" name="e"><Opts list={others.map(e => ({ v: e.id, l: `${e.nom} — ${e.ville} · ${e.activite}` }))} /></select></div>,
      onOk(fd) { upd(x => { if (x.mode !== 'devis') x.entreprises = []; x.entreprises.push(String(fd.get('e'))) }) },
    })
  }
  const send = async () => {
    if (!c.lignes.length) return toast('Sélectionnez au moins un poste à chiffrer', 'err')
    if (!c.entreprises.length) return toast('Sélectionnez au moins une entreprise', 'err')
    if (c.mode === 'unique' && !c.motifUnique.trim()) return toast('Motif obligatoire pour une entreprise unique', 'err')
    if (model.sumCrit !== 100) return toast('Les critères doivent totaliser 100 %', 'err')
    await reserveIds(getS(), c.mode === 'accord' ? ['cs', 'bc'] : ['cs'])
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
      <ConsultationView
        model={model}
        onSaveDraft={() => { mutate(() => { /* persiste l'état courant */ }, { now: true }); toast('Brouillon de consultation enregistré', 'ok') }}
        onSend={send}
        onSetMode={setMode}
        onField={(k: TextField, v) => upd(x => { x[k] = v })}
        onToggleLine={(i, on) => upd(x => { x.lignes = on ? [...new Set([...x.lignes, i])].sort() : x.lignes.filter(v => v !== i) })}
        onAddEnt={addEnt}
        onRemoveEnt={entId => upd(x => { x.entreprises = x.entreprises.filter(v => v !== entId) })}
        onVisite={on => upd(x => { x.visite = on })}
        onCreneau={(i, v) => upd(x => { x.creneaux[i] = v })}
        onCritere={(k: CritereKey, v) => upd(x => { x.criteres[k] = Math.max(0, Number(v) || 0) })}
        onOpenPhoto={src => openModal({ title: 'Photo', wide: true, noFooter: true, body: <img src={src} alt="Photo" className="w-full rounded-lg" /> })}
      />
    </Layout>
  )
}

export default Consultation
