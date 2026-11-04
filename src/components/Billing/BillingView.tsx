import Chip from '@/components/ui/Chip'
import SearchBox from '@/components/ui/SearchBox'
import PageHead from '@/components/ui/PageHead'
import Kpi from '@/components/ui/Kpi'
import { fdy } from '@/helpers/dates'
import { FACTURE_STATUT, fmoney } from '@/helpers/billing'
import { STATUT_FILTERS } from './constants'
import type { BillingViewProps } from './types'

/** Liste des factures de refacturation (présentation seule) : suivi des montants et création depuis une demande. */
const BillingView = ({ ui, model, onCreate, onChange }: BillingViewProps) => (
  <>
    <PageHead title="Refacturation" subtitle="Factures adressées aux usagers pour les travaux qui leur sont imputés. Une facture se prépare à partir d'une demande." />
    <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Kpi label="À encaisser" value={fmoney(model.totalAPayer)} sub="factures émises, non payées" />
      <Kpi label="Encaissé" value={fmoney(model.totalPaye)} sub="factures payées" />
    </div>
    <section className="card pad mb-4">
      <label className="lbl" htmlFor="nf">Nouvelle facture à partir d'une demande</label>
      <select className="in w-full sm:w-[420px]" id="nf" value="" disabled={model.candidates.length === 0} onChange={e => { if (e.target.value) onCreate(e.target.value) }}>
        <option value="">{model.candidates.length ? 'Choisir une demande avec travaux refacturés…' : 'Aucune demande à refacturer'}</option>
        {model.candidates.map(c => <option key={c.v} value={c.v}>{c.l}</option>)}
      </select>
    </section>
    <div className="row mb-4 !gap-2.5">
      <SearchBox className="w-full sm:w-[280px]" value={ui.q} placeholder="N° de facture, demande, destinataire…" onChange={q => onChange({ q })} />
      {STATUT_FILTERS.map(([k, l]) => <button key={k} className={`btn btn-sm ${ui.statut === k ? 'btnp' : ''}`} onClick={() => onChange({ statut: k })}>{l}</button>)}
    </div>
    {model.rows.length === 0 ? <div className="card pad empty">Aucune facture.</div> : (
      <div className="tbl-wrap">
        <table className="t min-w-[720px]">
          <thead><tr><th>N°</th><th>Demande</th><th>Destinataire</th><th>Date</th><th>Échéance</th><th className="text-right">Total TTC</th><th>Statut</th></tr></thead>
          <tbody>
            {model.rows.map(({ f, ttc }) => (
              <tr key={f.id}>
                <td><a href={`#/facture/${f.id}`}><strong>{f.id}</strong></a></td>
                <td><a href={`#/demande/${f.demandeId}`}>{f.demandeId}</a></td>
                <td>{f.destinataire.nom || <span className="muted">à renseigner</span>}</td>
                <td>{fdy(f.date)}</td>
                <td>{fdy(f.echeance)}</td>
                <td className="text-right">{fmoney(ttc)}</td>
                <td><Chip tone={FACTURE_STATUT[f.statut][1]}>{FACTURE_STATUT[f.statut][0]}</Chip></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </>
)

export default BillingView
