import type { StepHeaderProps } from './types'

/** Titre de section numérotée (formulaires en plusieurs étapes). */
const StepHeader = ({ step, title, className = '', children }: StepHeaderProps) => (
  <div className={`sec-h ${className}`}>
    <span className="step">{step}</span>
    <h2 className="h2">{title}</h2>
    {children}
  </div>
)

export default StepHeader
