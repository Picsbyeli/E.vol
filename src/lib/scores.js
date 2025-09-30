import { db } from './firebase'
import { addDoc, collection, serverTimestamp, query, where, orderBy, limit, getDocs } from 'firebase/firestore'

// Submit score: if uid provided (signed-in) write to Firestore; otherwise store locally per game
export async function submitScore({ uid, displayName='Guest', gameKey, score }) {
  if (uid) {
    await addDoc(collection(db, 'scores'), { uid, displayName, gameKey, score, createdAt: serverTimestamp() })
  } else {
    const key = `guest-scores-${gameKey}`
    try {
      const existing = JSON.parse(localStorage.getItem(key) || '[]')
      existing.push({ score, ts: Date.now() })
      localStorage.setItem(key, JSON.stringify(existing))
    } catch (e) {
      // localStorage might be unavailable (private mode); fail silently
      console.warn('[GuestScore] Failed to persist guest score', e)
    }
  }
}

// Retrieve guest scores (local only). Not exported originally, but useful if UI wants to show them.
export function getGuestScores(gameKey) {
  try {
    return JSON.parse(localStorage.getItem(`guest-scores-${gameKey}`) || '[]')
  } catch {
    return []
  }
}

export async function getTopForGame(gameKey, topN=50){
  const q = query(collection(db, 'scores'), where('gameKey', '==', gameKey), orderBy('score', 'desc'), limit(topN))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id:d.id, ...d.data() }))
}

export async function getGlobalTop(topN=50){
  const q = query(collection(db, 'scores'), orderBy('score', 'desc'), limit(topN))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id:d.id, ...d.data() }))
}