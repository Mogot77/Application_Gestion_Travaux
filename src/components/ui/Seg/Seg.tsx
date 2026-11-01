import type { SegProps } from './types'

/** Groupe de boutons exclusifs. */
const Seg = <K extends string | number>({ values, sel, onPick, clsFor, className = '', label }: SegProps<K>) => (
  <div className={`seg ${className}`} role="group" aria-label={label}>
    {values.map(v => {
      const k = typeof v === 'object' ? v.k : v
      const l = typeof v === 'object' ? v.l : v
      const on = String(k) === String(sel) ? (clsFor ? clsFor(k) : 'on') : ''
      return <button key={String(k)} type="button" className={on} onClick={() => onPick(k)}>{l}</button>
    })}
  </div>
)

export default Seg
