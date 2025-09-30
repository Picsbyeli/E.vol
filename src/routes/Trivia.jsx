import { useState } from 'react'
import q from '../data/trivia_5th.json'
import { submitScore } from '../lib/scores'
import { useAuth } from '../main'

export default function Trivia(){
  const { user } = useAuth()
  const [i,setI]=useState(0), [score,setScore]=useState(0), [picked,setPicked]=useState(null)
  const cur = q[i]

  const pick = (idx)=>{
    setPicked(idx)
    if (idx===cur.answerIdx) setScore(s=>s+1)
    setTimeout(()=>{ setPicked(null); setI(n=>n+1) }, 700)
  }

  const end = i>=q.length

  const submit = async()=>{
    if (!user) return
    await submitScore({ uid:user.uid, displayName:user.displayName||user.email, gameKey:'trivia-5th', score })
    alert('Score submitted!')
  }

  if (end) return (
    <div className="mx-auto max-w-xl p-4">
      <h1 className="text-2xl font-bold mb-2">Trivia – Done!</h1>
      <p>Your score: {score} / {q.length}</p>
      <button className="mt-3 border rounded px-3 py-2" onClick={submit}>Submit score</button>
    </div>
  )

  return (
    <div className="mx-auto max-w-xl p-4">
      <h1 className="text-2xl font-bold mb-2">Are You Smarter Than a 5th Grader?</h1>
      <div className="bg-white rounded-2xl shadow p-4">
        <p className="text-sm text-gray-500">Grade {cur.grade}</p>
        <h2 className="text-lg font-semibold mb-2">{cur.question}</h2>
        <div className="grid gap-2">
          {cur.choices.map((c,idx)=> (
            <button key={idx} className={`border rounded px-3 py-2 ${picked!==null && idx===cur.answerIdx ? 'bg-green-100' : ''}`} onClick={()=>pick(idx)} disabled={picked!==null}>
              {c}
            </button>
          ))}
        </div>
        <p className="mt-3">Score: {score} / {i+1}</p>
      </div>
    </div>
  )
}