import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Field from '@/components/ui/Field'
import Icon from '@/components/ui/Icon'
import { useEffect } from 'react'
import { useApp } from '@/hooks/useApp'
import { go, useRoute } from '@/hooks/useRoute'
import { useUiState } from '@/hooks/useUiState'
import { setUi as resetUiKey } from '@/store/local/uiState'
import Layout from '@/components/Layout'
import Opts from '@/components/ui/Opts'
import Seg from '@/components/ui/Seg'
import AddPhoto from '@/components/ui/AddPhoto'
import Photo from '@/components/Photo'

import { nextId, profilOf } from '@/helpers/domain'
import { TODAY } from '@/helpers/dates'
import { readPhotos } from '@/helpers/photos'
import { INIT, KEY } from './constants'
import type { ConstatUi } from './types'
import PageHead from '@/components/ui/PageHead'


/** Saisie d'un constat d'état (ouvert à tout salarié). */
const NewInspection = () => {
  const { S, mutate, toast } = useApp()
  const { query: q } = useRoute()
  const [c, patch] = useUiState<ConstatUi>(KEY, INIT)
  const needReset = !!q.log && c.logementId !== q.log
  useEffect(() => {
    if (needReset) patch({ ...INIT, logementId: q.log })
  }, [needReset, q.log, patch])

  const pf = profilOf(S)
  const contexte = c.contexte || S.ref.contextes[0]
  const n = c.signalements.length

  const save = (andCreate: boolean) => {
    if (!c.logementId) return toast('Choisissez le logement', 'err')
    if (c.proprete == null) return toast('Note de propreté obligatoire', 'err')
    if (!c.bati) return toast('État du bâti obligatoire', 'err')
    const danger = c.signalements.some(s => /Chauffage d'appoint|électrique dangereuse/.test(s))
    const low = c.proprete <= 2
    const proprete = c.proprete
    let ceId = ''
    mutate(s => {
      const id = nextId(s, 'ce'); ceId = id
      s.constats.unshift({ id, date: TODAY, logementId: c.logementId, auteur: pf.nom, fonction: pf.fonction, contexte, proprete, bati: c.bati, signalements: c.signalements.slice(), photos: c.photos.slice(), commentaire: c.commentaire, suite: danger || low ? 'alerte' : '' })
    }, { now: true })
    resetUiKey(KEY, null)
    toast(`Constat ${ceId} enregistré${danger ? ' · alerte sécurité envoyée à la coordination' : low ? ' · coordination alertée' : ''}`, danger || low ? 'err' : 'ok')
    if (c.signalements.some(s => / HS$/.test(s)) && !andCreate) window.setTimeout(() => toast("Équipement hors service : pensez à créer une demande d'intervention"), 600)
    go(andCreate ? `#/demande/new?log=${c.logementId}&constat=${ceId}` : '#/constats')
  }

  return (
    <Layout active="constats">
      <PageHead title="Nouveau constat d'état" subtitle="Ouvert à tout salarié. Décrire le logement, jamais le ménage." />
      <Card className="mx-auto flex max-w-[720px] flex-col gap-5 p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Logement" htmlFor="cl"><select className="in" id="cl" value={c.logementId} onChange={e => patch({ logementId: e.target.value })}>
            <Opts placeholder="Choisir…" list={S.logements.filter(l => l.typo !== 'BUR').map(l => ({ v: l.id, l: `${l.id} · ${l.typo} · ${l.ville}` }))} /></select></Field>
          <Field label="Contexte de la visite" htmlFor="cc"><select className="in" id="cc" value={contexte} onChange={e => patch({ contexte: e.target.value })}><Opts list={S.ref.contextes} /></select></Field>
        </div>
        <div><span className="lbl">Propreté · note de 0 à 6</span>
          <div className="pnote" role="group" aria-label="Note de propreté">{[0, 1, 2, 3, 4, 5, 6].map(i => <button key={i} type="button" className={c.proprete === i ? 'on' + (i <= 2 ? ' low' : '') : ''} onClick={() => patch({ proprete: i })}>{i}</button>)}</div>
          <div className="row between small muted mt-1.5"><span>0 insalubre</span><strong className="text-ink">{c.proprete == null ? '—' : c.proprete + ' · ' + S.ref.proprete[c.proprete].toLowerCase()}</strong><span>6 impeccable</span></div>
          {c.proprete != null && c.proprete <= 2 && <p className="small mb-0 mt-1.5 text-danger">Note ≤ 2 : la coordination sera alertée.</p>}</div>
        <div><span className="lbl">État général du bâti</span><Seg values={['Bon', 'Moyen', 'Dégradé']} sel={c.bati} onPick={v => patch({ bati: v })} /></div>
        <div><span className="lbl">Signalements</span>
          <button type="button" className="in text-left" aria-expanded={c.open} onClick={() => patch({ open: !c.open })}>{n ? `${n} sélectionné${n > 1 ? 's' : ''}` : 'Aucun signalement'}<Icon name="chev" /></button>
          {c.open ? Object.entries(S.ref.signalements).map(([g, arr]) => (
            <div key={g}><div className="small muted mb-0.5 mt-3 font-bold tracking-[.04em]">{g.toUpperCase()}</div>
              {arr.map(sg => <label key={sg} className="chkrow"><input type="checkbox" checked={c.signalements.includes(sg)} onChange={e => patch({ signalements: e.target.checked ? [...c.signalements, sg] : c.signalements.filter(x => x !== sg) })} /> {sg}</label>)}</div>
          )) : (n > 0 && <div className="mt-2">{c.signalements.map(sg => <span key={sg} className="tag">{sg}</span>)}</div>)}
        </div>
        <div><span className="lbl">Photos ({c.photos.length}) · pas de personne sur les photos</span>
          <div className="row !gap-2">{c.photos.map((ph, j) => <Photo key={j} src={ph} w={72} h={72} onDelete={() => patch({ photos: c.photos.filter((_x, k) => k !== j) })} />)}
            <AddPhoto label="+" w={72} h={72} onFiles={f => readPhotos(f).then(ph => patch({ photos: [...c.photos, ...ph] }))} /></div></div>
        <Field label="Commentaire" htmlFor="cm"><textarea className="in" id="cm" value={c.commentaire} placeholder="Décrire le logement" onChange={e => patch({ commentaire: e.target.value })} /></Field>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button onClick={() => save(true)}>Enregistrer et créer une demande</Button>
          <Button variant="primary" onClick={() => save(false)}>Enregistrer le constat</Button>
        </div>
      </Card>
    </Layout>
  )
}

export default NewInspection
