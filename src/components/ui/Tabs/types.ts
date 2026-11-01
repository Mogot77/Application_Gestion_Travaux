import type { ReactNode } from 'react'

export type TabItem<K extends string> = { key: K; label: ReactNode; badge?: ReactNode; badgeClassName?: string }

export type TabsProps<K extends string> = {
  tabs: TabItem<K>[]
  active: K
  onChange: (key: K) => void
  label?: string
  className?: string
}
