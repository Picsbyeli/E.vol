import { useEffect, useState } from 'react'
import { useAuth } from '../main'
import { submitScore } from '../lib/scores'

function empty(){ return Array.from({length:4},()=>Array(4).fill(0)) }
function addRandom(grid){
  const zeros=[]
  for(let r=0;r<4;r++) for(let c=0;c<4;c++) if(!grid[r][c]) zeros.push([r,c])
  if(!zeros.length) return grid
  const [r,c]=zeros[Math.floor(Math.random()*zeros.length)]
  grid[r][c] = Math.random()<0.9?2:4
  return grid
}
function rotate(g){ // rotate right
  const n=4, out=empty()
  for(let r=0;r<n;r++) for(let c=0;c<n;c++) out[c][n-1-r]=g[r][c]
  return out
}
function slide(row){
  const arr=row.filter(x=>x)
  for(let i=0;i<arr.length-1;i++) if(arr[i]===arr[i+1]){ arr[i]*=2; arr[i+1]=0 }
  const arr2=arr.filter(x=>x)
  while(arr2.length<4) arr2.push(0)
  return arr2
}

export default function BrainPuzzles(){
  const { user } = useAuth()
  const [grid,setGrid]=useState(()=> addRandom(addRandom(empty())))
  const [best,setBest]=useState(0)

  function move(times){
    let g=grid.map(row=>row.slice())
    for(let t=0;t<times;t++) g=rotate(g)
    const before=JSON.stringify(g)
    for(let r=0;r<4;r++) g[r]=slide(g[r])
    for(let t=0;t<(4-times)%4;t++) g=rotate(g)
    if(JSON.stringify(g)!==before){
      addRandom(g)
      setGrid(g)
      const max = Math.max(...g.flat())
      setBest(b=> Math.max(b, max))
    }
  }

  useEffect(()=>{
    const onKey=(e)=>{
      if(e.key==='ArrowLeft') move(0)
      if(e.key==='ArrowUp') move(1)
      if(e.key==='ArrowRight') move(2)
      if(e.key==='ArrowDown') move(3)
    }
    window.addEventListener('keydown', onKey)
    return ()=> window.removeEventListener('keydown', onKey)
  })

  const submit = async()=>{
    if (!user) return
    await submitScore({ uid:user.uid, displayName:user.displayName||user.email, gameKey:'2048', score:best })
    alert('Score submitted!')
  }

  return (
    <div className="mx-auto max-w-sm p-4">
      <h1 className="text-2xl font-bold mb-2">Brain Puzzles – 2048</h1>
      <div className="grid grid-cols-4 gap-2 bg-gray-200 p-2 rounded-2xl">
        {grid.map((row,ri)=> row.map((v,ci)=> (
          <div key={ri+'-'+ci} className="h-16 flex items-center justify-center rounded-lg bg-white text-lg font-bold">
            {v||''}
          </div>
        )))}
      </div>
      <div className="mt-3 flex gap-2">
        <button className="border rounded px-3 py-2" onClick={()=>setGrid(addRandom(addRandom(empty())))}>Reset</button>
        <button className="border rounded px-3 py-2" onClick={submit}>Submit best: {best}</button>
      </div>
      <p className="text-sm text-gray-500 mt-2">Use arrow keys.</p>
    </div>
  )
}