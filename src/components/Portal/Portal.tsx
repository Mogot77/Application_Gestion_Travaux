import type { Consultation, DocsEntreprise } from '@/types'
import Opts from '@/components/ui/Opts'
import { useApp } from '@/hooks/useApp'
import { go } from '@/hooks/useRoute'
import { useUiState } from '@/hooks/useUiState'
import { getCs, getEnt, hist } from '@/helpers/domain'
import { TODAY, addDays, fday, ftime, now } from '@/helpers/dates'
import { buildPortalModel } from './helpers'
import type { PortalDraft, PortalProps } from './types'
import PortalView from './PortalView'

/** Conteneur du portail externe des entreprises consultées (démonstration) : consultation du dossier, visite, question, dépôt du devis. */
const Portal = ({ csId, eid: eidParam }: PortalProps) => {
  const { S, mutate, toast, openModal } = useApp()
  const c = getCs(S, csId)
  const eid = eidParam || c?.entreprises[0] || ''
  const [p, setP] = useUiState<PortalDraft>(`portal:${csId}:${eid}`, {
    montantHT: '', tva: '10', delai: '', duree: '', validite: '3', postes: c ? c.lignes.slice() : [], pdf: '', slot: '',
  })
  const model = buildPortalModel(S, csId, eid)
  const noop = () => {}
  if (!model) return <PortalView model={null} draft={p} onDraft={setP} onChooseSlot={noop} onAsk={noop} onDeposit={noop} onDecline={noop} onUpdateDoc={noop} onSwitchEnt={noop} onOpenPhoto={noop} />
  const { e } = model

  const upd = (fn: (x: Consultation) => void) => mutate(s => { const x = getCs(s, model.c.id); if (x) fn(x) }, { now: true })

  const chooseSlot = (slot: string) => {
    setP({ slot })
    upd(x => {
      x.reponses[eid] = x.reponses[eid] || { statut: 'attente' }
      x.reponses[eid].slot = slot
      hist(x, `Visite réservée par ${e.nom} · ${fday(slot)} ${ftime(slot)}`)
    })
    toast('Créneau de visite réservé', 'ok')
  }
  const ask = (v: string) => {
    upd(x => { x.questions.push({ q: v, a: '', at: now() }); hist(x, 'Question posée sur le portail') })
    toast('Question envoyée à la coordination', 'ok')
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
    <PortalView
      model={model}
      draft={p}
      onDraft={setP}
      onChooseSlot={chooseSlot}
      onAsk={ask}
      onDeposit={depot}
      onDecline={decline}
      onUpdateDoc={updateDoc}
      onSwitchEnt={id => go(`#/portail/${model.c.id}/${id}`)}
      onOpenPhoto={src => openModal({ title: 'Photo', wide: true, noFooter: true, body: <img src={src} alt="Photo" className="w-full rounded-lg" /> })}
    />
  )
}

export default Portal
