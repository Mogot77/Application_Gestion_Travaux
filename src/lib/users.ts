import { deleteDoc, doc, getDoc, onSnapshot, serverTimestamp, setDoc, collection } from 'firebase/firestore'
import { db } from './firebase'

export type Role = 'admin' | 'user'

export interface AppUser {
  email: string
  role: Role
  addedBy?: string
}

/** Administrateur d'origine : toujours autorisé (miroir des règles Firestore), il ne peut pas être retiré. */
export const BOOTSTRAP_ADMIN = 'vallet.morgan@gmail.com'

const COL = 'users'

export const normEmail = (e: string) => e.trim().toLowerCase()
export const isEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)

/** Rôle d'un compte, ou `null` s'il n'est pas dans la liste blanche. */
export async function fetchRole(email: string): Promise<Role | null> {
  const mail = normEmail(email)
  if (mail === BOOTSTRAP_ADMIN) return 'admin'
  const snap = await getDoc(doc(db, COL, mail))
  if (!snap.exists()) return null
  return snap.data().role === 'admin' ? 'admin' : 'user'
}

export const watchUsers = (cb: (u: AppUser[]) => void, onError: (e: unknown) => void) =>
  onSnapshot(collection(db, COL), snap => {
    cb(snap.docs.map(d => ({ email: d.id, role: d.data().role === 'admin' ? 'admin' : 'user', addedBy: d.data().addedBy }) as AppUser)
      .sort((a, b) => a.email.localeCompare(b.email)))
  }, onError)

export const saveUser = (email: string, role: Role, by: string) =>
  setDoc(doc(db, COL, normEmail(email)), { role, addedBy: by, updatedAt: serverTimestamp() }, { merge: true })

export const removeUser = (email: string) => deleteDoc(doc(db, COL, normEmail(email)))
