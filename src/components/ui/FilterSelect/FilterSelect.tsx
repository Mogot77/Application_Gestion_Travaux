import Opts from '@/components/ui/Opts'
import type { FilterSelectProps } from './types'

/** Liste déroulante de filtre : s'affiche en surbrillance quand une valeur est choisie. */
const FilterSelect = ({ value, onChange, label, options }: FilterSelectProps) => (
  <select className={`flt${String(value) !== '' ? ' on' : ''}`} aria-label={label} value={value} onChange={e => onChange(e.target.value)}>
    <Opts list={options} placeholder={label} />
  </select>
)

export default FilterSelect
