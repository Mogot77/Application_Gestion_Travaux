import type { PageHeadProps } from './types'

/** En-tête d'écran : titre, sous-titre optionnel et actions à droite. */
const PageHead = ({ title, subtitle, className = '', children }: PageHeadProps) => (
  <div className={`pagehead ${className}`}>
    <div>
      <h1 className="mb-1">{title}</h1>
      {subtitle != null && <p className="muted m-0">{subtitle}</p>}
    </div>
    {children}
  </div>
)

export default PageHead
