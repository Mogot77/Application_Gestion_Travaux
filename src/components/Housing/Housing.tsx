import { useApp } from '@/hooks/useApp'
import { go } from '@/hooks/useRoute'
import { useUiState } from '@/hooks/useUiState'
import Layout from '@/components/Layout'
import { uniqueEtabs } from '@/helpers/domain'
import { buildLogement, checkLogement, type NewLogement } from '@/helpers/logements'
import { INIT } from './constants'
import { buildHousingModel } from './helpers'
import HousingForm from './HousingForm'
import HousingView from './HousingView'
import LocationCard from './LocationCard'
import type { LogTab, LogUi, HousingProps } from './types'

/** Conteneur de l'écran logements : filtres et onglet persistés, création d'un logement, aperçu de photo et classement sans suite. */
const Housing = ({ id }: HousingProps) => {
  const { S, mutate, getS, toast, openModal } = useApp()
  const [ui, setUi] = useUiState<LogUi>('log', INIT)
  const model = buildHousingModel(S, ui, id)
  const selId = model.detail?.id
  const setTab = (t: LogTab) => { if (selId) setUi({ tab: t, tabFor: selId }) }

  const openNew = () => openModal({
    title: 'Nouveau logement', okLabel: 'Créer le logement', wide: true,
    body: <HousingForm etabs={uniqueEtabs(S)} />,
    onOk(fd) {
      const g = (k: string) => String(fd.get(k) || '').trim()
      const data: NewLogement = {
        typo: g('typo') || 'T2', surface: Number(fd.get('surface')) || 0, adresse: g('adresse'), bat: g('bat'), etage: g('etage'), apt: g('apt'),
        cp: g('cp'), ville: g('ville'), etab: g('etab'), section: g('section'), cgl: g('cgl'), dispositif: g('dispositif'),
        menage: g('menage'), secteur: g('secteur'), cles: g('cles'), acces: g('acces'),
      }
      const err = checkLogement(data)
      if (err) { toast(err, 'err'); return false }
      const created = buildLogement(getS(), data)
      mutate(s => { s.logements.push(buildLogement(s, data)) }, { now: true })
      toast(`${created.id} créé`, 'ok')
      go(`#/logement/${created.id}`)
    },
  })

  const sansSuite = (cid: string) => {
    mutate(s => { const c = s.constats.find(x => x.id === cid); if (c) c.suite = 'aucune' }, { now: true })
    toast('Constat classé sans suite')
  }

  // Le logement sélectionné (route, sinon premier de la liste) ; la carte de localisation est un conteneur à part (état propre)
  const sel = S.logements.find(l => l.id === selId)

  return (
    <Layout active="logements">
      <HousingView
        model={model}
        location={sel && <LocationCard sel={sel} />}
        onSearch={q => setUi({ q })}
        onDept={dept => setUi({ dept })}
        onTypo={typo => setUi({ typo })}
        onEtab={etab => setUi({ etab })}
        onNew={openNew}
        onTab={setTab}
        onOpenPhoto={src => openModal({ title: 'Photo', wide: true, noFooter: true, body: <img src={src} alt="Photo" className="w-full rounded-lg" /> })}
        onNoFollowUp={sansSuite}
      />
    </Layout>
  )
}

export default Housing
