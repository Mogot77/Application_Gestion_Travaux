import type { CrumbProps } from './types'

/** Fil d'Ariane : les éléments avec `href` sont des liens. */
const Crumb = ({ items }: CrumbProps) => (
  <div className="crumb">
    {items.map((it, i) => (
      <span key={i}>{i > 0 && ' › '}{it.href ? <a href={it.href}>{it.label}</a> : it.label}</span>
    ))}
  </div>
)

export default Crumb
