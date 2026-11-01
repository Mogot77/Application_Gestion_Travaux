import Card from '@/components/ui/Card'
import FilterSelect from '@/components/ui/FilterSelect'
import PageHead from '@/components/ui/PageHead'
import { InspectionsTableView } from '@/components/InspectionsTable'
import { fd } from '@/helpers/dates'
import type { InspectionsViewProps } from './types'

/** Liste des constats d'état (présentation seule : filtres, lignes et chiffres sont préparés par le conteneur). */
const InspectionsView = ({ model, onFilter, onOpenPhoto, onNoFollowUp }: InspectionsViewProps) => {
  const { filters, values, rows, month, sans } = model
  return (
    <>
      <PageHead title="Constats d'état des logements" subtitle="Déclarés par tout salarié. Ils décrivent le logement, jamais le ménage.">
        <a className="btn btnp" href="#/constat/new">+ Nouveau constat</a>
      </PageHead>
      <div className="row mb-4 !gap-2">
        {filters.map(f => <FilterSelect key={f.k} value={values[f.k]} onChange={v => onFilter(f.k, v)} label={f.label} options={f.options} />)}
      </div>
      <div className="cols !gap-4">
        <section className="card tbl-wrap min-w-0" style={{ flex: '999 1 700px' }}><InspectionsTableView rows={rows} withLog onOpenPhoto={onOpenPhoto} onNoFollowUp={onNoFollowUp} /></section>
        <aside className="col-side" style={{ flex: '1 1 280px' }}>
          <Card pad="md"><h2 className="h2 mb-3">Ce mois-ci</h2>
            <div className="grid grid-cols-2 gap-3">
              <div><div className="muted small">Constats</div><strong className="text-[22px]">{month.total}</strong></div>
              <div><div className="muted small">Propreté ≤ 2 / 6</div><strong className="text-[22px] text-danger">{month.low}</strong></div>
              <div><div className="muted small">Demandes créées</div><strong className="text-[22px]">{month.demandes}</strong></div>
              <div><div className="muted small">Alertes sécurité</div><strong className="text-[22px] text-danger">{month.alertes}</strong></div>
            </div></Card>
          <Card pad="md"><h2 className="h2">Sans constat depuis plus de 6 mois</h2><p className="muted small mb-2.5 mt-1">Seuil réglable par la direction</p>
            <ul className="m-0 flex list-none flex-col gap-2 p-0 text-[13px]">
              {sans.map(x => <li key={x.l.id} className="row between"><a href={`#/logement/${x.l.id}`}>{x.l.id} · {x.l.ville}</a><span className="muted">{x.last ? 'dernier : ' + fd(x.last) : 'jamais'}</span></li>)}
              {!sans.length && <li className="muted">Aucun</li>}
            </ul></Card>
        </aside>
      </div>
    </>
  )
}

export default InspectionsView
