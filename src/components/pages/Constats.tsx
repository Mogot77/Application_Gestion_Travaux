import { useApp } from '../../hooks/useApp'
import { useUiState } from '../../store/ui'
import { Layout } from '../layout/Layout'
import { Opts, type OptItem } from '../ui/Fields'
import { ConstatsTable } from '../ui/ConstatsTable'
import { getLog, profilOf, uniqueEtabs } from '../../lib/domain'
import { TODAY, diffDays, fd } from '../../lib/dates'

interface CeUi { prop: string; bati: string; sig: string; ctx: string; etab: string; per: string }
const INIT: CeUi = { prop: '', bati: '', sig: '', ctx: '', etab: '', per: '30' }

export function Constats() {
  const { S } = useApp()
  const [ui, setUi] = useUiState<CeUi>('ce', INIT)
  const list = S.constats.filter(c => {
    const l = getLog(S, c.logementId)
    if (ui.prop !== '' && c.proprete > Number(ui.prop)) return false
    if (ui.bati && c.bati !== ui.bati) return false
    if (ui.sig && !c.signalements.includes(ui.sig)) return false
    if (ui.ctx && c.contexte !== ui.ctx) return false
    if (ui.etab && l?.etab !== ui.etab) return false
    if (ui.per && diffDays(c.date, TODAY) > Number(ui.per)) return false
    if (S.profil === 'etab' && l?.etab !== profilOf(S).etab) return false
    return true
  }).sort((a, b) => b.date.localeCompare(a.date))
  const month = S.constats.filter(c => c.date.slice(0, 7) === TODAY.slice(0, 7))
  const sans = S.logements.filter(l => l.typo !== 'BUR')
    .map(l => ({ l, last: S.constats.filter(c => c.logementId === l.id).map(c => c.date).sort().pop() }))
    .filter(x => !x.last || diffDays(x.last, TODAY) > 182)
  const sel = (k: keyof CeUi, label: string, opts: OptItem[]) => (
    <select className={`flt${ui[k] !== '' ? ' on' : ''}`} value={ui[k]} onChange={e => setUi({ [k]: e.target.value })}><Opts list={opts} placeholder={label} /></select>
  )
  return (
    <Layout active="constats">
      <div className="pagehead">
        <div><h1 className="mb-1">Constats d'état des logements</h1><p className="muted m-0">Déclarés par tout salarié depuis son téléphone. Ils décrivent le logement, jamais le ménage.</p></div>
        <a className="btn btnp" href="#/m/constat">+ Nouveau constat</a>
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
        <section className="card tbl-wrap min-w-0" style={{ flex: '999 1 700px' }}><ConstatsTable list={list} withLog /></section>
        <aside className="col-side" style={{ flex: '1 1 280px' }}>
          <div className="card pad"><h2 className="h2 mb-3">Ce mois-ci</h2>
            <div className="grid grid-cols-2 gap-3">
              <div><div className="muted small">Constats</div><strong className="text-[22px]">{month.length}</strong></div>
              <div><div className="muted small">Propreté ≤ 2 / 6</div><strong className="text-[22px] text-danger">{month.filter(c => c.proprete <= 2).length}</strong></div>
              <div><div className="muted small">Demandes créées</div><strong className="text-[22px]">{month.filter(c => c.demandeId).length}</strong></div>
              <div><div className="muted small">Alertes sécurité</div><strong className="text-[22px] text-danger">{month.filter(c => c.signalements.some(s => /Chauffage d'appoint|électrique|Détecteur/.test(s))).length}</strong></div>
            </div></div>
          <div className="card pad"><h2 className="h2">Sans constat depuis plus de 6 mois</h2><p className="muted small mb-2.5 mt-1">Seuil réglable par la direction</p>
            <ul className="m-0 flex list-none flex-col gap-2 p-0 text-[13px]">
              {sans.map(x => <li key={x.l.id} className="row between"><a href={`#/logement/${x.l.id}`}>{x.l.id} · {x.l.ville}</a><span className="muted">{x.last ? 'dernier : ' + fd(x.last) : 'jamais'}</span></li>)}
              {!sans.length && <li className="muted">Aucun</li>}
            </ul></div>
        </aside>
      </div>
    </Layout>
  )
}
