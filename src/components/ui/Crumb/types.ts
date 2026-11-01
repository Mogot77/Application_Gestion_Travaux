import type { ReactNode } from 'react'

export type CrumbItem = { label: ReactNode; href?: string }

export type CrumbProps = { items: CrumbItem[] }
