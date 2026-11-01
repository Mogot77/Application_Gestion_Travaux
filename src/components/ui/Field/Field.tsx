import type { FieldProps } from './types'

/** Libellé + contrôle (input, select, Seg...). */
const Field = ({ label, htmlFor, hint, className = '', children }: FieldProps) => (
  <div className={className}>
    <label className="lbl" htmlFor={htmlFor}>{label}</label>
    {children}
    {hint && <div className="muted small mt-1">{hint}</div>}
  </div>
)

export default Field
