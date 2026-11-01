import { doc, runTransaction } from 'firebase/firestore'
import type { AppState } from '@/types'
import { db } from '@/store/queries/firebase'
import { maxNumber, pushReserved, type SeqKind } from '@/helpers/ids'

const TIMEOUT_MS = 5000

/** Compteurs partagés (`meta/counters`) : une transaction lit puis incrémente, donc deux utilisateurs ne peuvent pas obtenir le même numéro. */
const reserveNumber = (kind: SeqKind, floor: number): Promise<number> =>
  runTransaction(db, async tx => {
    const ref = doc(db, 'meta', 'counters')
    const snap = await tx.get(ref)
    const current = snap.exists() ? Number(snap.data()[kind]) || 0 : 0
    const n = Math.max(current, floor) + 1
    tx.set(ref, { [kind]: n }, { merge: true })
    return n
  })

const withTimeout = <T,>(p: Promise<T>, ms: number): Promise<T> =>
  Promise.race([p, new Promise<T>((_, rej) => window.setTimeout(() => rej(new Error('timeout')), ms))])

/** Réserve un numéro par type demandé, à utiliser juste après avec `nextId`. Hors ligne ou en cas d'échec, `nextId` retombe sur un numéro unique de secours. */
export const reserveIds = async (S: AppState, kinds: SeqKind[]): Promise<void> => {
  for (const kind of kinds) {
    try { pushReserved(kind, await withTimeout(reserveNumber(kind, maxNumber(S, kind)), TIMEOUT_MS)) } catch { /* numéro de secours */ }
  }
}
