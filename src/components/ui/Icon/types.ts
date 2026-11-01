import type { ReactNode } from 'react'

export type IconName = 'chev' | 'search' | 'cam' | 'photo' | 'info' | 'upload'

export type IconProps = { name: IconName; s?: number; c?: string; w?: number }

export type IconDef = { d: ReactNode; s: number; c: string; w?: number }
