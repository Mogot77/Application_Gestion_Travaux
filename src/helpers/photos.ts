/* Photos : redimensionnées, puis envoyées sur Cloudinary (URL partagée via Firestore).
   Sans configuration Cloudinary, ou hors ligne, la photo reste une data-URL locale (non synchronisée)
   et sera envoyée plus tard par `migrateLocalPhotos`. */
import type { AppState } from '../types'
import { forEachPhotoString, mapPhotoStrings } from './cloudState'

const CLOUD = import.meta.env.VITE_CLOUDINARY_CLOUD as string | undefined
const PRESET = import.meta.env.VITE_CLOUDINARY_PRESET as string | undefined

export const cloudinaryEnabled = !!CLOUD && !!PRESET
export const isLocalPhoto = (p: unknown): p is string => typeof p === 'string' && p.startsWith('data:')

const loadImage = (file: Blob): Promise<HTMLImageElement> => new Promise((res, rej) => {
  const url = URL.createObjectURL(file)
  const img = new Image()
  img.onload = () => { URL.revokeObjectURL(url); res(img) }
  img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Image illisible')) }
  img.src = url
})

const resize = async (file: Blob, max: number, quality: number): Promise<Blob> => {
  const img = await loadImage(file)
  const k = Math.min(1, max / Math.max(img.width, img.height))
  const c = document.createElement('canvas')
  c.width = Math.round(img.width * k); c.height = Math.round(img.height * k)
  c.getContext('2d')?.drawImage(img, 0, 0, c.width, c.height)
  return new Promise((res, rej) => c.toBlob(b => (b ? res(b) : rej(new Error('Image illisible'))), 'image/jpeg', quality))
}

const toDataUrl = (b: Blob): Promise<string> => new Promise((res, rej) => {
  const fr = new FileReader()
  fr.onerror = () => rej(new Error('Lecture impossible'))
  fr.onload = () => res(String(fr.result))
  fr.readAsDataURL(b)
})

const upload = async (b: Blob): Promise<string> => {
  const fd = new FormData()
  fd.append('file', b)
  fd.append('upload_preset', PRESET as string)
  const r = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, { method: 'POST', body: fd })
  if (!r.ok) throw new Error(`Cloudinary ${r.status}`)
  const j = await r.json() as { secure_url?: string }
  if (!j.secure_url) throw new Error('Cloudinary : réponse invalide')
  return j.secure_url
}

/** Redimensionne puis envoie la photo ; en cas d'échec réseau, renvoie une miniature locale. */
export const readPhoto = async (file: File): Promise<string> => {
  if (cloudinaryEnabled) {
    try { return await upload(await resize(file, 1280, 0.8)) } catch { /* repli local ci-dessous */ }
  }
  return toDataUrl(await resize(file, 640, 0.72))
}

export const readPhotos = (files: FileList | File[] | null): Promise<string[]> =>
  Promise.all([...(files || [])].filter(f => f.type.startsWith('image/')).map(f => readPhoto(f)))

/** Envoie sur Cloudinary les photos encore locales de l'état. Renvoie la table data-URL → URL (vide si rien à faire). */
export async function uploadLocalPhotos(S: AppState): Promise<Map<string, string>> {
  const done = new Map<string, string>()
  if (!cloudinaryEnabled) return done
  const found = new Set<string>()
  forEachPhotoString(S, p => { if (isLocalPhoto(p)) found.add(p) })
  for (const p of found) {
    try { done.set(p, await upload(await (await fetch(p)).blob())) } catch { /* sera retenté au prochain chargement */ }
  }
  return done
}

/** Remplace dans l'état les data-URL envoyées par leur URL. */
export const applyUploaded = (S: AppState, done: Map<string, string>): void => {
  mapPhotoStrings(S, p => done.get(p) ?? p)
}
