import type { TabsProps } from './types'

/** Onglets : un bouton par entrée, avec un badge optionnel. */
const Tabs = <K extends string>({ tabs, active, onChange, label, className = '' }: TabsProps<K>) => (
  <nav className={`tabs ${className}`} aria-label={label}>
    {tabs.map(t => (
      <button key={t.key} className={`tab${active === t.key ? ' on' : ''}`} onClick={() => onChange(t.key)}>
        {t.label}{t.badge != null && <> <b className={t.badgeClassName}>{t.badge}</b></>}
      </button>
    ))}
  </nav>
)

export default Tabs
