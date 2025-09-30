import { db } from './firebase'
import { addDoc, collection, serverTimestamp, query, where, orderBy, limit, getDocs } from 'firebase/firestore'

export async function submitScore({ uid, displayName, gameKey, score }){
  await addDoc(collection(db, 'scores'), { uid, displayName, gameKey, score, createdAt: serverTimestamp() })
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