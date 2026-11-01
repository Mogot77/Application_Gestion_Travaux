import { collection, doc, onSnapshot, writeBatch, type DocumentData } from 'firebase/firestore'
import type { AppState } from '@/types'
import { db } from '@/store/queries/firebase'
import { ALL_COLS, canon, pruneTo, removeDoc, toDocs, upsertDoc, type OrderMap } from '@/helpers/cloudState'

export type SyncOptions = {
  /** État local courant (importé dans Firestore si la base est vide). */
  local: () => AppState
  /** Applique une modification venue de la base à l'état de l'application. */
  apply: (fn: (s: AppState) => void) => void
  onReady: () => void
  onError: (e: unknown) => void
}

export type Sync = {
  /** Envoie les différences entre l'état et la base. */
  push: (S: AppState) => void
  stop: () => void
}

const BATCH = 400

/** Synchronise l'état partagé avec Firestore : lecture temps réel, écriture des seuls documents modifiés. */
export function startSync(o: SyncOptions): Sync {
  const known = new Map<string, string>() // chemin → JSON canonique connu de la base
  const order: OrderMap = new Map() // chemin → clé d'ordre du document
  const waiting = new Set<string>(ALL_COLS)
  let ready = false
  let metaFound = false
  let stopped = false

  const write = async (set: [string, string][], del: string[]) => {
    const ops: [string, string | null][] = [...set, ...del.map(p => [p, null] as [string, null])]
    try {
      for (let i = 0; i < ops.length; i += BATCH) {
        const b = writeBatch(db)
        for (const [p, json] of ops.slice(i, i + BATCH)) {
          if (json === null) b.delete(doc(db, p)); else b.set(doc(db, p), JSON.parse(json) as DocumentData)
        }
        await b.commit()
      }
    } catch (e) { o.onError(e) }
  }

  const push = (S: AppState) => {
    if (!ready || stopped) return
    const next = toDocs(S, order)
    const set: [string, string][] = []
    for (const [p, json] of next) if (known.get(p) !== json) { set.push([p, json]); known.set(p, json) }
    const del: string[] = []
    for (const p of [...known.keys()]) if (!next.has(p)) { del.push(p); known.delete(p); order.delete(p) }
    if (set.length || del.length) void write(set, del)
  }

  const finish = () => {
    if (metaFound) o.apply(s => pruneTo(s, p => known.has(p)))
    else { // base vide : première utilisation, on importe l'état local
      ready = true
      push(o.local())
    }
    ready = true
    o.onReady()
  }

  const unsubs = ALL_COLS.map(name => onSnapshot(collection(db, name), snap => {
    const first = waiting.has(name)
    const ops: ((s: AppState) => void)[] = []
    const keyOf = (id: string) => order.get(`${name}/${id}`)
    const changes = [...snap.docChanges()].sort((a, b) => ((a.doc.data()._i as number) ?? 0) - ((b.doc.data()._i as number) ?? 0))
    for (const ch of changes) {
      // Après le chargement, les écritures locales en attente sont déjà dans l'état : on les ignore.
      if (ready && ch.doc.metadata.hasPendingWrites) continue
      const path = `${name}/${ch.doc.id}`
      if (ch.type === 'removed') {
        if (known.delete(path)) ops.push(s => removeDoc(s, name, ch.doc.id))
      } else {
        const data = ch.doc.data()
        if (typeof data._i === 'number') order.set(path, data._i)
        const json = canon(data)
        if (known.get(path) === json) continue
        known.set(path, json)
        ops.push(s => upsertDoc(s, name, data, keyOf))
      }
    }
    if (name === 'meta' && !snap.empty) metaFound = true
    if (ops.length) o.apply(s => { for (const op of ops) op(s) })
    if (first) {
      // La base n'est déclarée vide qu'après une réponse du serveur (pas du seul cache).
      if (name === 'meta' && snap.empty && snap.metadata.fromCache) return
      waiting.delete(name)
      if (!waiting.size && !ready) finish()
    }
  }, e => o.onError(e)))

  return {
    push,
    stop: () => { stopped = true; unsubs.forEach(u => u()) },
  }
}
