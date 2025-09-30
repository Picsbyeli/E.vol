import { useEffect, useState } from 'react'
import { db } from '../lib/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { useAuth } from '../main'

export default function StatsHeader({ gameKey = null }) {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalScore: 0,
    gamesPlayed: 0,
    gamesWon: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    
    (async () => {
      try {
        setLoading(true)
        let q
        if (gameKey) {
          q = query(
            collection(db, 'scores'),
            where('uid', '==', user.uid),
            where('gameKey', '==', gameKey)
          )
        } else {
          q = query(
            collection(db, 'scores'),
            where('uid', '==', user.uid)
          )
        }
        
        const snap = await getDocs(q)
        let total = 0, played = 0, won = 0
        
        snap.forEach(doc => {
          const d = doc.data()
          total += d.score || 0
          played += 1
          if (d.score && d.score > 0) won += 1
        })
        
        setStats({ totalScore: total, gamesPlayed: played, gamesWon: won })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    })()
  }, [user, gameKey])

  const { totalScore, gamesPlayed, gamesWon } = stats
  const winRate = gamesPlayed ? Math.round((gamesWon / gamesPlayed) * 100) : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4 bg-white shadow rounded-2xl">
        <div className="animate-pulse text-gray-500">Loading stats...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center p-4 bg-white shadow rounded-2xl">
        <span className="text-gray-500">Sign in to track your stats</span>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 shadow rounded-2xl transition-all duration-200 hover:shadow-md">
      <Stat label="Total Score" value={totalScore} color="text-blue-600" />
      <Stat label="Games Played" value={gamesPlayed} color="text-green-600" />
      <Stat label="Win Rate" value={`${winRate}%`} color="text-purple-600" />
    </div>
  )
}

function Stat({ label, value, color = "text-gray-700" }) {
  return (
    <div className="flex flex-col items-center space-y-1">
      <span className={`text-2xl font-bold ${color} transition-colors duration-200`}>
        {value}
      </span>
      <span className="text-sm text-gray-600 font-medium">{label}</span>
    </div>
  )
}