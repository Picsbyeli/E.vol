import { addDoc, collection } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'

// Unified score saving: Firestore for authenticated users, localStorage for guests
export async function saveScore(gameId, score) {
  if (auth.currentUser) {
    await addDoc(collection(db, 'scores'), {
      uid: auth.currentUser.uid,
      gameId,
      score,
      timestamp: Date.now(),
    })
  } else {
    const key = `guest-scores-${gameId}`
    try {
      const scores = JSON.parse(localStorage.getItem(key) || '[]')
      scores.push({ score, timestamp: Date.now() })
      localStorage.setItem(key, JSON.stringify(scores))
    } catch (e) {
      console.warn('[GuestScore] Failed to persist local score', e)
    }
  }
}

export function getGuestScores(gameId){
  try {
    return JSON.parse(localStorage.getItem(`guest-scores-${gameId}`) || '[]')
  } catch {
    return []
  }
}
