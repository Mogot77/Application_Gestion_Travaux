import { initializeApp } from 'firebase/app'
import { GoogleAuthProvider, getAuth, onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth'

/** Configuration web Firebase : ces valeurs sont publiques par conception (la sécurité repose sur les règles et les domaines autorisés). */
const app = initializeApp({
  apiKey: 'AIzaSyCLHQyyxrT6sV_p8kFUgCYxTJKDDeRlgQY',
  authDomain: 'travaux-2975b.firebaseapp.com',
  projectId: 'travaux-2975b',
  storageBucket: 'travaux-2975b.firebasestorage.app',
  messagingSenderId: '120582669438',
  appId: '1:120582669438:web:31be5db5a599bfb91a842f',
})

const auth = getAuth(app)
const provider = new GoogleAuthProvider()
provider.setCustomParameters({ prompt: 'select_account' })

export type AuthUser = User

export const watchAuth = (cb: (u: User | null) => void) => onAuthStateChanged(auth, cb)
export const signInWithGoogle = () => signInWithPopup(auth, provider)
export const signOutUser = () => signOut(auth)
