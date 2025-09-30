import { useState } from 'react'

function makeBoard(){ return Array.from({length:6},()=>Array(7).fill(0)) }

export default function Strategy(){
  const [b,setB]=useState(makeBoard())
  const [p,setP]=useState(1)
  const [winner,setWinner]=useState(0)

  const drop=(c)=>{
    if (winner) return
    const g=b.map(r=>r.slice())
    for(let r=5;r>=0;r--){
      if(!g[r][c]){ g[r][c]=p; break }
    }
    setB(g)
    if(checkWin(g,p)) setWinner(p); else setP(p===1?2:1)
  }

  function checkWin(g,pl){
    const H=6,W=7
    const dirs=[[1,0],[0,1],[1,1],[1,-1]]
    for(let r=0;r<H;r++) for(let c=0;c<W;c++) if(g[r][c]===pl){
      for(const [dr,dc] of dirs){
        let k=1
        while(k<4 && g[r+dr*k]?.[c+dc*k]===pl) k++
        if(k===4) return true
      }
    }
    return false
  }

  return (
    <div className="mx-auto max-w-md p-4">
      <h1 className="text-2xl font-bold mb-2">Strategy – Connect Four</h1>
      <p className="mb-2">Player {winner||p}'s turn {winner? '(winner!)':''}</p>
      <div className="grid grid-cols-7 gap-1 bg-blue-200 p-1 rounded-xl">
        {b[0].map((_,c)=> (
          <button key={'c'+c} className="h-8 text-xs border rounded bg-white" onClick={()=>drop(c)}>Drop</button>
        ))}
        {b.map((row,ri)=> row.map((v,ci)=> (
          <div key={ri+'-'+ci} className="h-12 w-12 sm:h-14 sm:w-14 bg-blue-500 flex items-center justify-center rounded-full">
            <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-full ${v===0?'bg-white':v===1?'bg-red-500':'bg-yellow-400'}`}></div>
          </div>
        )))}
      </div>
      <div className="mt-3 flex gap-2">
        <button className="border rounded px-3 py-2" onClick={()=>{setB(makeBoard()); setP(1); setWinner(0)}}>Reset</button>
      </div>
    </div>
  )
}