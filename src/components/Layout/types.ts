import type { ReactNode } from 'react'
import type { Section } from '@/helpers/roles'

export type LayoutProps = { active?: string; children?: ReactNode }

export type NavItem = [Section, string, string]
