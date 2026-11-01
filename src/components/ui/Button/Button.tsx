import type { ButtonProps } from './types'

const Button = ({ variant = 'default', size = 'md', full = false, dashed = false, className = '', type = 'button', ...rest }: ButtonProps) => (
  <button
    type={type}
    className={`btn ${variant === 'primary' ? 'btnp' : variant === 'danger' ? 'btnd' : ''} ${size === 'sm' ? 'btn-sm' : ''} ${full ? 'btn-w' : ''} ${dashed ? 'btn-dash' : ''} ${className}`}
    {...rest}
  />
)

export default Button
