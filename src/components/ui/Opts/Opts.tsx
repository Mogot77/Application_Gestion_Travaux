import type { OptsProps } from './types'

/** Options d'un <select> à partir d'une liste de valeurs ou de paires {v, l}. */
const Opts = ({ list, placeholder }: OptsProps) => (
  <>
    {placeholder != null && <option value="">{placeholder}</option>}
    {list.map(o => {
      const v = typeof o === 'object' ? o.v : o
      const l = typeof o === 'object' ? o.l : o
      return <option key={String(v)} value={String(v)}>{l}</option>
    })}
  </>
)

export default Opts
