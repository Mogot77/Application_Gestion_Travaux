import Icon from '@/components/ui/Icon'
import type { SearchBoxProps } from './types'

/** Champ de recherche avec loupe, au style des filtres. */
const SearchBox = ({ value, onChange, placeholder, id, className = '' }: SearchBoxProps) => (
  <label className={`flt cursor-text ${className}`}>
    <Icon name="search" />
    <input id={id} className="min-w-0 flex-1 border-0 outline-0" style={{ font: 'inherit' }} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} />
  </label>
)

export default SearchBox
