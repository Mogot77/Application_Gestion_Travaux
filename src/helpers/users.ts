import { doc, getDoc } from 'firebase/firestore'
import { db } from './firebase'
import { normRole, type Role } from './roles'

export type { Role }

/** Administrateur d'origine : toujours autorisé (miroir des règles Firestore), il ne peut pas être retiré. */
export const BOOTSTRAP_ADMIN = 'vallet.morgan@gmail.com'

const COL = 'users'

export const normEmail = (e: string) => e.trim().toLowerCase()

/** Rôle et établissement d'un compte, ou `null` s'il n'est pas dans la liste blanche. */
export async function fetchAccess(email: string): Promise<{ role: Role; etab?: string } | null> {
  const mail = normEmail(email)
  if (mail === BOOTSTRAP_ADMIN) return { role: 'directeur' }
  const snap = await getDoc(doc(db, COL, mail))
  if (!snap.exists()) return null
  const d = snap.data()
  return { role: normRole(d.role), etab: typeof d.etab === 'string' && d.etab ? d.etab : undefined }
}
