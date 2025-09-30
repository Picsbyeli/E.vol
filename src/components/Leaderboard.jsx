import { useEffect, useState } from 'react'
import { getTopForGame, getGlobalTop } from '../lib/scores'

export default function Leaderboard({ gameKey = null }){
  const [rows, setRows] = useState([])
  useEffect(() => { (async ()=>{
    const data = gameKey ? await getTopForGame(gameKey) : await getGlobalTop()
    setRows(data)
  })() }, [gameKey])

  return (
    <div>
      <h2 className="text-xl font-bold mb-2">{gameKey ? `Leaderboard – ${gameKey}` : 'Global Leaderboard'}</h2>
      <ol className="space-y-1">
        {rows.map((r, i)=> (
          <li key={r.id} className="flex justify-between border rounded px-3 py-2 bg-white">
            <span>{i+1}. {r.displayName || 'Anonymous'}</span>
            <span className="font-semibold">{r.score}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}