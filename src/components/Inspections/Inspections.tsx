import { useApp } from '@/hooks/useApp'
import { useUiState } from '@/hooks/useUiState'
import Layout from '@/components/Layout'
import Opts from '@/components/ui/Opts'
import type { OptItem } from '@/components/ui/Opts'
import Card from '@/components/ui/Card'
import InspectionsTable from '@/components/InspectionsTable'
import { uniqueEtabs } from '@/helpers/domain'
import { TODAY, fd } from '@/helpers/dates'
import { INIT } from './constants'
import { filterConstats, logementsSansConstat } from './helpers'
import type { ConstatsFilters } from './types'

const Inspections = () => {
  const { S } = useApp()
  const [ui, setUi] = useUiState<ConstatsFilters>('ce', INIT)
  const list = filterConstats(S, ui)
  const month = S.constats.filter(c => c.date.slice(0, 7) === TODAY.slice(0, 7))
  const sans = logementsSansConstat(S)
  const sel = (k: keyof ConstatsFilters, label: string, opts: OptItem[]) => (
    <select className={`flt${ui[k] !== '' ? ' on' : ''}`} value={ui[k]} onChange={e => setUi({ [k]: e.target.value })}><Opts list={opts} placeholder={label} /></select>
  )
  return (
    <Layout active="constats">
      <div className="pagehead">
        <div><h1 className="mb-1">Constats d'état des logements</h1><p className="muted m-0">Déclarés par tout salarié. Ils décrivent le logement, jamais le ménage.</p></div>
        <a className="btn btnp" href="#/constat/new">+ Nouveau constat</a>
      </div>
      <div className="row mb-4 !gap-2">
        {sel('prop', 'Propreté (0 à 6)', [0, 1, 2, 3, 4, 5].map(n => ({ v: n, l: `Propreté ≤ ${n}` })))}
        {sel('bati', 'État du bâti', ['Bon', 'Moyen', 'Dégradé'])}
        {sel('sig', 'Signalements', Object.values(S.ref.signalements).flat())}
        {sel('ctx', 'Contexte', S.ref.contextes)}
        {S.profil !== 'etab' && sel('etab', 'Établissement', uniqueEtabs(S))}
        {sel('per', 'Période : tout', [{ v: '30', l: 'Période : 30 jours' }, { v: '90', l: 'Période : 90 jours' }, { v: '365', l: 'Période : 12 mois' }])}
      </div>
      <div className="cols !gap-4">
        <section className="card tbl-wrap min-w-0" style={{ flex: '999 1 700px' }}><InspectionsTable list={list} withLog /></section>
        <aside className="col-side" style={{ flex: '1 1 280px' }}>
          <Card pad="md"><h2 className="h2 mb-3">Ce mois-ci</h2>
            <div className="grid grid-cols-2 gap-3">
              <div><div className="muted small">Constats</div><strong className="text-[22px]">{month.length}</strong></div>
              <div><div className="muted small">Propreté ≤ 2 / 6</div><strong className="text-[22px] text-danger">{month.filter(c => c.proprete <= 2).length}</strong></div>
              <div><div className="muted small">Demandes créées</div><strong className="text-[22px]">{month.filter(c => c.demandeId).length}</strong></div>
              <div><div className="muted small">Alertes sécurité</div><strong className="text-[22px] text-danger">{month.filter(c => c.signalements.some(s => /Chauffage d'appoint|électrique|Détecteur/.test(s))).length}</strong></div>
            </div></Card>
          <Card pad="md"><h2 className="h2">Sans constat depuis plus de 6 mois</h2><p className="muted small mb-2.5 mt-1">Seuil réglable par la direction</p>
            <ul className="m-0 flex list-none flex-col gap-2 p-0 text-[13px]">
              {sans.map(x => <li key={x.l.id} className="row between"><a href={`#/logement/${x.l.id}`}>{x.l.id} · {x.l.ville}</a><span className="muted">{x.last ? 'dernier : ' + fd(x.last) : 'jamais'}</span></li>)}
              {!sans.length && <li className="muted">Aucun</li>}
            </ul></Card>
        </aside>
      </div>
    </Layout>
  )
}

export default Inspections
