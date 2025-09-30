import { useMemo, useState } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'

export default function ChessGame(){
  const game = useMemo(()=> new Chess(), [])
  const [,force] = useState(0)
  const onDrop = (from, to)=>{
    const move = game.move({ from, to, promotion:'q' })
    if (!move) return false
    force(n=>n+1)
    return true
  }
  return (
    <div className="mx-auto max-w-xl p-4">
      <h1 className="text-2xl font-bold mb-2">Chess</h1>
      <Chessboard position={game.fen()} onPieceDrop={onDrop} boardWidth={480} />
      <p className="mt-2">{game.isCheckmate()? 'Checkmate!' : game.isDraw()? 'Draw' : ''}</p>
    </div>
  )
}