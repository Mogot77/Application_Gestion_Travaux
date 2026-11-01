import { useEffect } from 'react'
import { useApp } from '@/hooks/useApp'
import { go, useRoute } from '@/hooks/useRoute'
import { useUiState } from '@/hooks/useUiState'
import { setUi as resetUiKey } from '@/store/local/uiState'
import { reserveIds } from '@/store/queries/counters'
import Layout from '@/components/Layout'
import { nextId, profilOf } from '@/helpers/domain'
import { TODAY } from '@/helpers/dates'
import { readPhotos } from '@/helpers/photos'
import { INIT, KEY } from './constants'
import { buildNewInspectionModel } from './helpers'
import NewInspectionView from './NewInspectionView'
import type { ConstatUi } from './types'

/** Saisie d'un constat d'état (ouvert à tout salarié). */
const NewInspection = () => {
  const { S, mutate, getS, toast, openModal } = useApp()
  const { query: q } = useRoute()
  const [c, patch] = useUiState<ConstatUi>(KEY, INIT)
  const needReset = !!q.log && c.logementId !== q.log
  useEffect(() => {
    if (needReset) patch({ ...INIT, logementId: q.log })
  }, [needReset, q.log, patch])

  const pf = profilOf(S)
  const contexte = c.contexte || S.ref.contextes[0]

  const save = async (andCreate: boolean) => {
    if (!c.logementId) return toast('Choisissez le logement', 'err')
    if (c.proprete == null) return toast('Note de propreté obligatoire', 'err')
    if (!c.bati) return toast('État du bâti obligatoire', 'err')
    const danger = c.signalements.some(s => /Chauffage d'appoint|électrique dangereuse/.test(s))
    const low = c.proprete <= 2
    const proprete = c.proprete
    await reserveIds(getS(), ['ce'])
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
      <NewInspectionView
        model={buildNewInspectionModel(S, c)}
        onPatch={patch}
        onSave={save}
        onAddFiles={f => readPhotos(f).then(ph => patch({ photos: [...c.photos, ...ph] }))}
        onOpenPhoto={src => openModal({ title: 'Photo', wide: true, noFooter: true, body: <img src={src} alt="Photo" className="w-full rounded-lg" /> })}
      />
    </Layout>
  )
}

export default NewInspection
