import { deleteDoc, doc, getDoc, onSnapshot, serverTimestamp, setDoc, collection } from 'firebase/firestore'
import { db } from './firebase'
import { normRole, type Role } from './roles'

export type { Role }

export interface AppUser {
  email: string
  role: Role
  /** Établissement de rattachement (rôles travailleur social, chef de service, directeur d'établissement). */
  etab?: string
  addedBy?: string
}

/** Administrateur d'origine : toujours autorisé (miroir des règles Firestore), il ne peut pas être retiré. */
export const BOOTSTRAP_ADMIN = 'vallet.morgan@gmail.com'

const COL = 'users'

export const normEmail = (e: string) => e.trim().toLowerCase()
export const isEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)

/** Rôle et établissement d'un compte, ou `null` s'il n'est pas dans la liste blanche. */
export async function fetchAccess(email: string): Promise<{ role: Role; etab?: string } | null> {
  const mail = normEmail(email)
  if (mail === BOOTSTRAP_ADMIN) return { role: 'directeur' }
  const snap = await getDoc(doc(db, COL, mail))
  if (!snap.exists()) return null
  const d = snap.data()
  return { role: normRole(d.role), etab: typeof d.etab === 'string' && d.etab ? d.etab : undefined }
}

export const watchUsers = (cb: (u: AppUser[]) => void, onError: (e: unknown) => void) =>
  onSnapshot(collection(db, COL), snap => {
    cb(snap.docs.map(d => ({ email: d.id, role: normRole(d.data().role), etab: d.data().etab || undefined, addedBy: d.data().addedBy }) as AppUser)
      .sort((a, b) => a.email.localeCompare(b.email)))
  }, onError)

export const saveUser = (email: string, role: Role, by: string, etab = '') =>
  setDoc(doc(db, COL, normEmail(email)), { role, etab, addedBy: by, updatedAt: serverTimestamp() }, { merge: true })

export const removeUser = (email: string) => deleteDoc(doc(db, COL, normEmail(email)))
