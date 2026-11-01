import type { KpiProps } from './types'

/** Indicateur chiffré : libellé, valeur et précision. */
const Kpi = ({ label, value, sub, valueClassName = '' }: KpiProps) => (
  <div className="card kpi">
    <div className="l">{label}</div>
    <div className={`v ${valueClassName}`}>{value}</div>
    {sub != null && <div className="s">{sub}</div>}
  </div>
)

export default Kpi
