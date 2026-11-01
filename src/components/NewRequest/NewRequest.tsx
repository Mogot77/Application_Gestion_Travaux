import { useEffect } from 'react'
import type { AppState, Demande, DraftDemande, SinistreInfo, UrgenceKey } from '@/types'
import { useApp } from '@/hooks/useApp'
import { go, useRoute } from '@/hooks/useRoute'
import Layout from '@/components/Layout'
import { now } from '@/helpers/dates'
import { hist, nbPhotos, nextId, piecesFor } from '@/helpers/domain'
import { readPhotos } from '@/helpers/photos'
import { reserveIds } from '@/store/queries/counters'
import { buildNewRequestModel, emptyLine, newDraft } from './helpers'
import NewRequestView from './NewRequestView'
import type { DraftField, LineField } from './types'

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

  // `fn` s'exécute dans le reducer (Immer) : il ne doit jamais appeler `getS()` (Redux l'interdit), il reçoit l'état `s` à la place.
  const upd = (fn: (d: DraftDemande, s: AppState) => void) => mutate(s => { if (s.draft) { fn(s.draft, s); s.draft.savedAt = now() } })
  const model = buildNewRequestModel(S, dr)

  const onLog = (id: string) => upd((d, st) => {
    d.logementId = id
    const l = st.logements.find(x => x.id === id)
    if (l) { d.acces = l.acces || d.acces; d.numCles = l.cles !== '—' ? l.cles : '' }
    const p = piecesFor(st, l)
    d.lignes.forEach(li => { if (li.piece && ![...p.pieces, ...p.autres].includes(li.piece)) li.piece = '' })
  })
  const setLine = (i: number, k: LineField, v: string) => upd(d => {
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
  const send = async () => {
    if (!model.check.ok) return
    await reserveIds(getS(), ['di'])
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
      <NewRequestView
        model={model}
        onField={(k: DraftField, v) => upd(d => { d[k] = v })}
        onUrgence={k => upd(d => { d.urgence = k })}
        onSinistreInfo={(k: keyof SinistreInfo, v) => upd(d => { d.sinistreInfo[k] = v })}
        onLogement={onLog}
        onLine={setLine}
        onExtra={setExtra}
        onAddLine={() => upd(d => { d.lignes.push(emptyLine()) })}
        onRemoveLine={i => upd(d => { d.lignes.splice(i, 1) })}
        onAddPhotos={addPhotos}
        onDeletePhoto={(i, j) => upd(d => { d.lignes[i].photos.splice(j, 1) })}
        onOpenPhoto={src => openModal({ title: 'Photo', wide: true, noFooter: true, body: <img src={src} alt="Photo" className="w-full rounded-lg" /> })}
        onSend={send}
        onSave={save}
        onDiscard={discard}
      />
    </Layout>
  )
}

export default NewRequest
