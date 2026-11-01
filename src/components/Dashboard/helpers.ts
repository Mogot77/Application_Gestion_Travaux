import { fnum } from '@/helpers/dates'

export const avg = (arr: number[]): number | null => arr.length ? arr.reduce((s, x) => s + x, 0) / arr.length : null

export const fj = (n: number | null): string => n == null ? '—' : fnum(n, 1) + ' j'
