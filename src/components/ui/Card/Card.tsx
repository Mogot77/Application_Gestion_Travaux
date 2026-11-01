import type { CardProps } from './types'

const Card = ({ pad = 'none', className = '', children, ...rest }: CardProps) => (
  <div className={`card ${pad === 'md' ? 'pad' : pad === 'sm' ? 'pad-s' : ''} ${className}`} {...rest}>{children}</div>
)

export default Card
