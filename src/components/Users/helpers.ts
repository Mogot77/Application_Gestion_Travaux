import { deleteDoc, doc, onSnapshot, serverTimestamp, setDoc, collection } from 'firebase/firestore'
import { db } from '@/store/queries/firebase'
import { normRole, type Role } from '@/helpers/roles'
import { normEmail } from '@/store/queries/users'
import { COL } from './constants'
import type { AppUser } from './types'

export const isEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)

export const watchUsers = (cb: (u: AppUser[]) => void, onError: (e: unknown) => void) =>
  onSnapshot(collection(db, COL), snap => {
    cb(snap.docs.map(d => ({ email: d.id, role: normRole(d.data().role), etab: d.data().etab || undefined, addedBy: d.data().addedBy }) as AppUser)
      .sort((a, b) => a.email.localeCompare(b.email)))
  }, onError)

export const saveUser = (email: string, role: Role, by: string, etab = '') =>
  setDoc(doc(db, COL, normEmail(email)), { role, etab, addedBy: by, updatedAt: serverTimestamp() }, { merge: true })

export const removeUser = (email: string) => deleteDoc(doc(db, COL, normEmail(email)))
