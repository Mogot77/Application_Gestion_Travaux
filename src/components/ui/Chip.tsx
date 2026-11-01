import type { ReactNode } from 'react'
import type { Demande, Tone, UrgenceKey } from '../../types'
import { useApp } from '../../hooks/useApp'
import { URG, statInfo } from '../../lib/domain'

export function Chip({ tone = 'gr', children, className = '' }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={`chip ${tone} ${className}`}>{children}</span>
}

export function UrgChip({ k }: { k?: UrgenceKey | '' }) {
  if (!k || !URG[k]) return null
  return <Chip tone={URG[k][1]}>{URG[k][0]}</Chip>
}

export function StatChip({ d }: { d: Demande }) {
  const { S } = useApp()
  const [l, c] = statInfo(S, d)
  return <Chip tone={c}>{l}</Chip>
}
