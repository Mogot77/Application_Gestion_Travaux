import type { Referentiels as Ref } from '@/types'
import type { GroupKey, ListKey, Target } from './types'

export const pick = (r: Ref, t: Target): string[] => t.group ? (r[t.key as GroupKey])[t.group] : r[t.key as ListKey]
