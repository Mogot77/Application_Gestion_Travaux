import type { ChipProps } from './types'

const Chip = ({ tone = 'gr', children, className = '' }: ChipProps) => (
  <span className={`chip ${tone} ${className}`}>{children}</span>
)

export default Chip
