import type { ReactNode } from 'react'

export type OptItem = string | number | { v: string | number; l: string }

/** Options d'un <select> à partir d'une liste de valeurs ou de paires {v, l}. */
export function Opts({ list, placeholder }: { list: OptItem[]; placeholder?: string }) {
  return (
    <>
      {placeholder != null && <option value="">{placeholder}</option>}
      {list.map(o => {
        const v = typeof o === 'object' ? o.v : o
        const l = typeof o === 'object' ? o.l : o
        return <option key={String(v)} value={String(v)}>{l}</option>
      })}
    </>
  )
}

/** Groupe de boutons exclusifs. */
export function Seg<K extends string | number>({ values, sel, onPick, clsFor, className = '', label }: {
  values: (K | { k: K; l: string })[]; sel: K | null | undefined; onPick: (k: K) => void
  clsFor?: (k: K) => string; className?: string; label?: string
}) {
  return (
    <div className={`seg ${className}`} role="group" aria-label={label}>
      {values.map(v => {
        const k = typeof v === 'object' ? v.k : v
        const l = typeof v === 'object' ? v.l : v
        const on = String(k) === String(sel) ? (clsFor ? clsFor(k) : 'on') : ''
        return <button key={String(k)} type="button" className={on} onClick={() => onPick(k)}>{l}</button>
      })}
    </div>
  )
}

/** Liste de couples libellé / valeur. */
export function Kv({ pairs }: { pairs: [string, ReactNode][] }) {
  return (
    <dl className="kv">
      {pairs.map(([k, v]) => <div key={k} className="contents"><dt>{k}</dt><dd>{v}</dd></div>)}
    </dl>
  )
}

export function Note({ tone = '', children, className = '' }: { tone?: '' | 'warn' | 'info'; children: ReactNode; className?: string }) {
  return <div className={`note ${tone} ${className}`}>{children}</div>
}
