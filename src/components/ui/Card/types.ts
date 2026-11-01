import type { HTMLAttributes } from 'react'

export type CardProps = HTMLAttributes<HTMLDivElement> & { pad?: 'none' | 'sm' | 'md' }
