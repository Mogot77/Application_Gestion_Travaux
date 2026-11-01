import { useEffect } from 'react'
import type { Demande, Ligne } from '@/types'
import { useApp } from '@/hooks/useApp'
import { go } from '@/hooks/useRoute'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Field from '@/components/ui/Field'
import Opts from '@/components/ui/Opts'
import { circuitLabel, dureeST, getD, getLog, hist, nextId } from '@/helpers/domain'
import { TODAY, fdur, now } from '@/helpers/dates'
import { readPhotos } from '@/helpers/photos'
import { reserveIds } from '@/store/queries/counters'
import { buildQualificationModel } from './helpers'
import QualificationView from './QualificationView'
import type { LineField, QualifAction, QualificationProps } from './types'

const Qualification = ({ id }: QualificationProps) => {
  const { S, mutate, getS, toast, openModal } = useApp()
  const model = buildQualificationModel(S, id)
  const d = model?.d
  const isEtab = S.profil === 'etab'

  // Prise en charge automatique par la coordination à l'ouverture
  const takeOver = !!d && d.statut === 'a_qualifier' && !isEtab
  useEffect(() => {
    if (takeOver) mutate(s => { const x = getD(s, id); if (x) { x.statut = 'en_qualification'; hist(x, 'Prise en charge par la coordination') } })
  }, [takeOver, id, mutate])

  if (!model || !d) return <Layout active="demandes"><Card pad="md" className="empty">Demande {id} introuvable. <a href="#/demandes">Retour aux demandes</a></Card></Layout>

  /** Modifie la demande courante (copie de l'état) puis persiste. */
  const upd = (fn: (x: Demande) => void, persistNow = false) => mutate(s => { const x = getD(s, id); if (x) fn(x) }, { now: persistNow })
  const simple = (fn: (x: Demande) => void, msg?: string, kind: 'ok' | '' = '') => { upd(fn, true); if (msg) toast(msg, kind) }

  const valider = async () => {
    if (d.lignes.some(l => !l.circuit)) return toast('Choisissez un circuit pour chaque ligne', 'err')
    if (d.lignes.some(l => l.circuit === 'ST') && !getD(getS(), id)?.ft) await reserveIds(getS(), ['ft'])
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
  const sinistreTravaux = async () => {
    if (!getD(getS(), id)?.ft) await reserveIds(getS(), ['ft'])
    mutate(s => { const x = getD(s, id); if (!x) return; x.lignes.forEach(l => { l.circuit = 'ST' }); x.ft = x.ft || nextId(s, 'ft'); x.statut = 'a_planifier'; hist(x, 'Indemnisation actée · travaux confiés au service technique') }, { now: true })
    go('#/planning?sel=' + id)
  }

  const actions: Record<QualifAction, () => unknown> = {
    completee, reactualisee, renvoyer, rejeter, valider, relancer, cloturer, bailleurFait, relancerBailleur, presteFait, declaration, sinistreTravaux,
  }

  const setLine = (i: number, k: LineField, v: string) => upd(x => {
    const l = x.lignes[i]
    if (k === 'imputation') l.imputation = v
    else if (k === 'circuit') l.circuit = v as Ligne['circuit']
    else l.urgence = v as Ligne['urgence']
    if (k === 'circuit' && v === 'bailleur') x.lignes[i].imputation = 'Bailleur propriétaire'
  })
  const addPhotos = (i: number, files: FileList) => readPhotos(files).then(ph => upd(x => { x.lignes[i].photos.push(...ph); hist(x, `${ph.length} photo(s) ajoutée(s) à la ligne ${i + 1}`) }, true))

  return (
    <Layout active="demandes">
      <QualificationView
        model={model}
        onAction={a => { actions[a]() }}
        onSetLine={setLine}
        onDuree={(i, delta) => upd(x => { x.lignes[i].duree = Math.max(30, x.lignes[i].duree + delta) })}
        onAddPhotos={addPhotos}
        onMessage={text => upd(x => { x.message = text })}
        onOpenPhoto={src => openModal({ title: 'Photo', wide: true, noFooter: true, body: <img src={src} alt="Photo" className="w-full rounded-lg" /> })}
      />
    </Layout>
  )
}

export default Qualification
