import { Timestamp, collection, doc, onSnapshot, query, serverTimestamp, where, writeBatch, type DocumentData } from 'firebase/firestore'
import type { AppState } from '@/types'
import { db } from '@/store/queries/firebase'
import { ALL_COLS, ITEM_COLS, canon, pruneTo, removeDoc, stripMeta, toDocs, upsertDoc, type OrderMap } from '@/helpers/cloudState'
import { canResume, loadSync, newer, saveSync, type Cursor } from '@/store/queries/syncCursor'

export type SyncOptions = {
  /** État local courant (cache chargé au démarrage ; importé dans Firestore si la base est vide). */
  local: () => AppState
  /** Applique une modification venue de la base à l'état de l'application. */
  apply: (fn: (s: AppState) => void) => void
  onReady: () => void
  onError: (e: unknown) => void
  /** Appelé quand une écriture réussit après un échec. */
  onRecovered?: () => void
}

export type Sync = {
  /** Envoie les différences entre l'état et la base. */
  push: (S: AppState) => void
  stop: () => void
}

const BATCH = 400
/** Une écriture refusée est retentée avec un délai croissant, puis abandonnée (ex. droits insuffisants). */
const RETRY_MAX = 5
const retryDelay = (n: number) => Math.min(2000 * 2 ** n, 30000)

/** Synchronise l'état partagé avec Firestore.
 *  - Lecture complète (premier lancement, cache effacé, ou plus d'un jour depuis la dernière) : on écoute toutes les collections.
 *  - Lecture incrémentale sinon : on part du cache local et on ne relit que les documents modifiés depuis le curseur (`updatedAt`).
 *  Écriture : seuls les documents modifiés, avec `updatedAt` serveur ; une suppression laisse une « pierre tombale »
 *  (`deleted: true`) pour que les autres clients, en lecture incrémentale, la voient aussi. */
export function startSync(o: SyncOptions): Sync {
  const saved = loadSync()
  const known = new Map<string, string>() // chemin → JSON canonique connu de la base
  const order: OrderMap = new Map(saved ? Object.entries(saved.order) : []) // chemin → clé d'ordre
  const cursors: Record<string, Cursor> = {}

  // Reprise incrémentale seulement si chaque élément du cache a sa clé d'ordre (sinon on réécrirait des documents).
  const cached = o.local()
  const complete = ITEM_COLS.every(col => (cached[col] as { id: string }[]).every(it => order.has(`${col}/${it.id}`)))
  const incremental = canResume(saved) && complete
  let fullAt = 0
  if (incremental && saved) {
    fullAt = saved.fullAt
    Object.assign(cursors, saved.cursors)
    for (const [p, json] of toDocs(cached, order)) known.set(p, json)
  } else order.clear()

  const failedDel = new Set<string>() // suppressions dont l'écriture a échoué : à rejouer
  let failures = 0
  let retryTimer: number | undefined
  const missingStamp = new Set<string>() // documents sans `updatedAt` (écrits avant la synchro incrémentale)
  const waiting = new Set<string>(ALL_COLS)
  let ready = false
  let metaFound = false
  let stopped = false

  const saveCursor = () => {
    if (ready) saveSync({ v: 1, fullAt, cursors, order: Object.fromEntries(order) })
  }

  const write = async (set: [string, string][], del: string[]) => {
    const ops: [string, string | null][] = [...set, ...del.map(p => [p, null] as [string, null])]
    try {
      for (let i = 0; i < ops.length; i += BATCH) {
        const b = writeBatch(db)
        for (const [p, json] of ops.slice(i, i + BATCH)) {
          if (json === null) b.set(doc(db, p), { deleted: true, updatedAt: serverTimestamp() })
          else b.set(doc(db, p), { ...(JSON.parse(json) as DocumentData), updatedAt: serverTimestamp() })
        }
        await b.commit()
      }
      if (failures) { failures = 0; o.onRecovered?.() }
    } catch (e) {
      // On « oublie » ces écritures : le prochain envoi recalcule les différences et les rejoue.
      for (const [p] of set) known.delete(p)
      for (const p of del) failedDel.add(p)
      o.onError(e)
      if (failures < RETRY_MAX) {
        window.clearTimeout(retryTimer)
        retryTimer = window.setTimeout(() => push(o.local()), retryDelay(failures++))
      }
    }
  }

  /** Donne un `updatedAt` aux documents qui n'en ont pas, pour qu'ils soient vus par les lectures incrémentales. */
  const backfill = async () => {
    const paths = [...missingStamp]
    missingStamp.clear()
    try {
      for (let i = 0; i < paths.length; i += BATCH) {
        const b = writeBatch(db)
        for (const p of paths.slice(i, i + BATCH)) b.set(doc(db, p), { updatedAt: serverTimestamp() }, { merge: true })
        await b.commit()
      }
    } catch (e) { o.onError(e) }
  }

  const push = (S: AppState) => {
    if (!ready || stopped) return
    const next = toDocs(S, order)
    const set: [string, string][] = []
    for (const [p, json] of next) if (known.get(p) !== json) { set.push([p, json]); known.set(p, json) }
    const del: string[] = [...failedDel]
    failedDel.clear()
    for (const p of [...known.keys()]) if (!next.has(p)) { del.push(p); known.delete(p); order.delete(p) }
    if (set.length || del.length) { void write(set, del); saveCursor() }
  }

  const finish = () => {
    if (incremental) { /* le cache est déjà la base de départ */ }
    else if (metaFound) o.apply(s => pruneTo(s, p => known.has(p)))
    else { // base vide : première utilisation, on importe l'état local
      ready = true
      push(o.local())
    }
    ready = true
    if (!incremental) { fullAt = Date.now(); void backfill() }
    saveCursor()
    o.onReady()
  }

  const unsubs = ALL_COLS.map(name => {
    const c = cursors[name]
    const source = incremental ? query(collection(db, name), where('updatedAt', '>', new Timestamp(c?.[0] ?? 0, c?.[1] ?? 0))) : collection(db, name)
    return onSnapshot(source, snap => {
      const first = waiting.has(name)
      const ops: ((s: AppState) => void)[] = []
      const keyOf = (id: string) => order.get(`${name}/${id}`)
      const changes = [...snap.docChanges()].sort((a, b) => ((a.doc.data()._i as number) ?? 0) - ((b.doc.data()._i as number) ?? 0))
      if (import.meta.env.DEV) console.info(`[sync] ${incremental ? 'incrémentale' : 'complète'} ${name} : ${changes.length} document(s)`)
      for (const ch of changes) {
        // Après le chargement, les écritures locales en attente sont déjà dans l'état : on les ignore.
        if (ready && ch.doc.metadata.hasPendingWrites) continue
        const path = `${name}/${ch.doc.id}`
        if (ch.type === 'removed') {
          // En lecture incrémentale, un document ne quitte jamais la requête (son `updatedAt` ne fait qu'augmenter).
          if (!incremental && known.delete(path)) { order.delete(path); ops.push(s => removeDoc(s, name, ch.doc.id)) }
          continue
        }
        const raw = ch.doc.data()
        const ts = raw.updatedAt
        if (ts instanceof Timestamp) {
          const cur: Cursor = [ts.seconds, ts.nanoseconds]
          if (!cursors[name] || newer(cur, cursors[name])) cursors[name] = cur
        } else if (!incremental && !raw.deleted) missingStamp.add(path)
        if (raw.deleted) {
          order.delete(path)
          known.delete(path)
          ops.push(s => removeDoc(s, name, ch.doc.id))
          continue
        }
        const data = stripMeta(raw)
        if (typeof data._i === 'number') order.set(path, data._i)
        const json = canon(data)
        if (known.get(path) === json) continue
        known.set(path, json)
        ops.push(s => upsertDoc(s, name, data, keyOf))
      }
      if (name === 'meta' && !snap.empty) metaFound = true
      if (ops.length) o.apply(s => { for (const op of ops) op(s) })
      if (first) {
        // La base n'est déclarée vide qu'après une réponse du serveur (pas du seul cache).
        if (!incremental && name === 'meta' && snap.empty && snap.metadata.fromCache) return
        waiting.delete(name)
        if (!waiting.size && !ready) finish()
      }
      saveCursor()
    }, e => o.onError(e))
  })

  return {
    push,
    stop: () => { stopped = true; window.clearTimeout(retryTimer); unsubs.forEach(u => u()) },
  }
}
