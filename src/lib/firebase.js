import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getDatabase } from 'firebase/database'

// Minimal hard‑coded Firebase config (safe to commit: Firebase web API keys are public identifiers)
// IMPORTANT: Replace the placeholder values below with the NEW values from
// Firebase Console > Project Settings > General > Your apps (Web app) > Config.
// Do NOT reuse the previously leaked / flagged apiKey or appId.
// If you use the Realtime Database, you can optionally add databaseURL later.
const firebaseConfig = {
  apiKey: 'REPLACE_WITH_NEW_API_KEY', // e.g. AIza... (new, not the revoked one)
  authDomain: 'evol-b02ac.firebaseapp.com',
  projectId: 'evol-b02ac',
  storageBucket: 'evol-b02ac.appspot.com',
  messagingSenderId: '556949855579', // verify this matches the new config block
  appId: '1:556949855579:web:REPLACE_WITH_NEW_APP_ID_HASH',
  // databaseURL: 'https://evol-b02ac-default-rtdb.firebaseio.com', // <- uncomment if RTDB needed
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
export const db = getFirestore(app)
export const rtdb = getDatabase(app)

// After updating the placeholders, commit again to deploy.