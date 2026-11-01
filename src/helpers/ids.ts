/* Numéros lisibles (DI-2026-0042...) : attribués par un compteur Firestore atomique (store/queries/counters.ts), jamais calculés
   localement, pour que deux utilisateurs ne reçoivent jamais le même numéro. Les numéros réservés attendent ici qu'un `nextId` les prenne. */
import type { AppState } from '@/types'

export type SeqKind = keyof AppState['seq']

const PREFIX: Record<SeqKind, string> = { di: 'DI', ce: 'CE', cs: 'CS', ft: 'FT', bc: 'BC' }
const reserved: Record<SeqKind, number[]> = { di: [], ce: [], cs: [], ft: [], bc: [] }

export const pushReserved = (kind: SeqKind, n: number): void => { reserved[kind].push(n) }
export const takeReserved = (kind: SeqKind): number | undefined => reserved[kind].shift()

const numberOf = (id?: string): number => {
  const m = /-(\d+)$/.exec(id ?? '')
  return m ? Number(m[1]) : 0
}

/** Plus grand numéro déjà utilisé pour ce type : plancher du compteur (données antérieures au compteur serveur). */
export const maxNumber = (S: AppState, kind: SeqKind): number => {
  const ids: (string | undefined)[] = kind === 'di' ? S.demandes.map(d => d.id)
    : kind === 'ce' ? S.constats.map(c => c.id)
    : kind === 'cs' ? S.consultations.map(c => c.id)
    : kind === 'ft' ? S.demandes.map(d => d.ft)
    : S.consultations.map(c => c.decision?.bc)
  return Math.max(S.seq[kind], ...ids.map(numberOf))
}

export const formatId = (kind: SeqKind, year: string, n: number | string): string =>
  `${PREFIX[kind]}-${year}-${typeof n === 'number' ? String(n).padStart(4, '0') : n}`

/** Numéro de secours, sans compteur (hors ligne) : suffixe aléatoire, donc sans risque de collision. */
export const fallbackSuffix = (): string => 'T' + Math.random().toString(36).slice(2, 6).toUpperCase()
