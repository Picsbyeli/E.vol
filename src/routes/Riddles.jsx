import { useEffect, useState } from 'react'
import data from '../data/riddles.json'
import { useAuth } from '../main'
import { submitScore } from '../lib/scores'
import StatsHeader from '../components/StatsHeader'
import Leaderboard from '../components/Leaderboard'

export default function Riddles(){
  const { user } = useAuth()
  const [idx, setIdx] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [streak, setStreak] = useState(0)
  const [totalScore, setTotalScore] = useState(0)
  const [hintsUsed, setHintsUsed] = useState(0)
  
  // Filters
  const [difficulty, setDifficulty] = useState('All')
  const [category, setCategory] = useState('All')
  
  // Get unique categories and difficulties from data
  const categories = ['All', ...new Set(data.map(r => r.category))]
  const difficulties = ['All', ...new Set(data.map(r => r.difficulty))]
  
  // Filtered riddles
  const filtered = data.filter(r =>
    (difficulty === 'All' || r.difficulty === difficulty) &&
    (category === 'All' || r.category === category)
  )
  
  const riddle = filtered[idx % filtered.length]
  
  const onCorrect = () => {
    const points = getPointsForRiddle(riddle.difficulty, hintsUsed)
    setShowAnswer(false)
    setShowHint(false)
    setIdx(i => i + 1)
    setStreak(s => s + 1)
    setTotalScore(s => s + points)
    setHintsUsed(0)
  }
  
  const onSkip = () => {
    setShowAnswer(false)
    setShowHint(false)
    setIdx(i => i + 1)
    setStreak(0)
    setHintsUsed(0)
  }
  
  const onHint = () => {
    setShowHint(true)
    setHintsUsed(h => h + 1)
  }
  
  const getPointsForRiddle = (difficulty, hints) => {
    const basePoints = { Easy: 10, Medium: 20, Hard: 30 }[difficulty] || 10
    const hintPenalty = hints * 5
    return Math.max(1, basePoints - hintPenalty)
  }
  
  const submit = async () => {
    if (!user) return
    await submitScore({
      uid: user.uid,
      displayName: user.displayName || user.email,
      gameKey: 'riddles',
      score: totalScore,
    })
    alert(`Score of ${totalScore} submitted!`)
    setTotalScore(0)
    setStreak(0)
  }
  
  const newRiddle = () => {
    setIdx(Math.floor(Math.random() * filtered.length))
    setShowAnswer(false)
    setShowHint(false)
    setHintsUsed(0)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="mx-auto max-w-4xl p-4 space-y-6">
        <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          🧩 Riddles Challenge
        </h1>
        
        <StatsHeader gameKey="riddles" />
        
        {/* Game Stats */}
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <div className="flex flex-wrap justify-center gap-6 text-center">
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-green-600">{streak}</span>
              <span className="text-sm text-gray-600">Current Streak</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-blue-600">{totalScore}</span>
              <span className="text-sm text-gray-600">Session Score</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-purple-600">{filtered.length}</span>
              <span className="text-sm text-gray-600">Available Riddles</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Filters</h3>
          <div className="flex flex-wrap gap-3">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Difficulty</label>
              <select
                className="border border-gray-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                value={difficulty}
                onChange={e => {
                  setDifficulty(e.target.value)
                  setIdx(0)
                }}
              >
                {difficulties.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                className="border border-gray-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                value={category}
                onChange={e => {
                  setCategory(e.target.value)
                  setIdx(0)
                }}
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
                onClick={newRiddle}
              >
                🎲 New Riddle
              </button>
            </div>
          </div>
        </div>

        {/* Main Game Area */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Riddle Card */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    riddle.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                    riddle.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {riddle.difficulty}
                  </span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    {riddle.category}
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  Points: {getPointsForRiddle(riddle.difficulty, hintsUsed)}
                </span>
              </div>
              
              <div className="text-xl leading-relaxed text-gray-800 bg-gray-50 p-4 rounded-lg">
                {riddle.q}
              </div>
              
              {showHint && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded transition-all duration-300">
                  <div className="flex items-center">
                    <span className="text-yellow-600 text-sm font-medium">💡 Hint:</span>
                  </div>
                  <p className="text-yellow-800 mt-1">{riddle.hint}</p>
                </div>
              )}
              
              {showAnswer && (
                <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded transition-all duration-300">
                  <div className="flex items-center">
                    <span className="text-green-600 text-sm font-medium">✅ Answer:</span>
                  </div>
                  <p className="text-green-800 mt-1 font-semibold">{riddle.a}</p>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                {!showHint && (
                  <button
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
                    onClick={onHint}
                  >
                    💡 Get Hint (-5 pts)
                  </button>
                )}
                <button
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
                  onClick={() => setShowAnswer(s => !s)}
                >
                  {showAnswer ? '🙈 Hide Answer' : '👁️ Reveal Answer'}
                </button>
                <button
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
                  onClick={onCorrect}
                >
                  ✅ I Solved It!
                </button>
                <button
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
                  onClick={onSkip}
                >
                  ⏭️ Skip
                </button>
              </div>
              
              {totalScore > 0 && (
                <button
                  className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 mt-4"
                  onClick={submit}
                >
                  🏆 Submit Score ({totalScore} points)
                </button>
              )}
            </div>
          </div>
          
          {/* Leaderboard */}
          <div className="bg-white rounded-2xl shadow-lg p-4">
            <Leaderboard gameKey="riddles" />
          </div>
        </div>
      </div>
    </div>
  )
}