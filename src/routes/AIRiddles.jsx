import { useEffect, useState } from 'react'
import { useAuth } from '../main'
import { submitScore } from '../lib/scores'
import { generateQuestion } from '../lib/ai'
import StatsHeader from '../components/StatsHeader'
import Leaderboard from '../components/Leaderboard'
import staticData from '../data/riddles.json'

export default function AIRiddles() {
  const { user } = useAuth()
  const [riddles, setRiddles] = useState(staticData)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [streak, setStreak] = useState(0)
  const [totalScore, setTotalScore] = useState(0)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [difficulty, setDifficulty] = useState('All')
  const [category, setCategory] = useState('All')

  const currentRiddle = riddles[currentIndex]

  // Filter riddles
  const filteredRiddles = riddles.filter(r =>
    (difficulty === 'All' || r.difficulty === difficulty) &&
    (category === 'All' || r.category === category)
  )

  const getPointsForRiddle = (riddle, hints) => {
    const basePoints = { Easy: 10, Medium: 20, Hard: 30 }[riddle?.difficulty] || 10
    const hintPenalty = hints * 5
    return Math.max(1, basePoints - hintPenalty)
  }

  const generateNewRiddle = async () => {
    setIsGenerating(true)
    try {
      const newRiddle = await generateQuestion('riddle')
      if (newRiddle) {
        setRiddles(prev => [...prev, newRiddle])
        setCurrentIndex(riddles.length) // Move to the new riddle
      }
    } catch (error) {
      console.error('Failed to generate riddle:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const onCorrect = () => {
    const points = getPointsForRiddle(currentRiddle, hintsUsed)
    setShowAnswer(false)
    setShowHint(false)
    setStreak(s => s + 1)
    setTotalScore(s => s + points)
    setHintsUsed(0)
    nextRiddle()
  }

  const onSkip = () => {
    setShowAnswer(false)
    setShowHint(false)
    setStreak(0)
    setHintsUsed(0)
    nextRiddle()
  }

  const nextRiddle = () => {
    const filtered = filteredRiddles
    const nextIndex = (filtered.findIndex(r => r === currentRiddle) + 1) % filtered.length
    const nextRiddleInFiltered = filtered[nextIndex]
    const actualIndex = riddles.findIndex(r => r === nextRiddleInFiltered)
    setCurrentIndex(actualIndex)
  }

  const onHint = () => {
    setShowHint(true)
    setHintsUsed(h => h + 1)
  }

  const submit = async () => {
    if (!user || totalScore === 0) return
    await submitScore({
      uid: user.uid,
      displayName: user.displayName || user.email,
      gameKey: 'ai-riddles',
      score: totalScore,
    })
    alert(`Score of ${totalScore} submitted!`)
    setTotalScore(0)
    setStreak(0)
  }

  const categories = ['All', ...new Set(riddles.map(r => r.category).filter(Boolean))]
  const difficulties = ['All', ...new Set(riddles.map(r => r.difficulty).filter(Boolean))]

  if (!currentRiddle) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-4">Loading riddles...</p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="mx-auto max-w-4xl p-4 space-y-6">
        <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          🤖 AI-Powered Riddles
        </h1>
        
        <StatsHeader gameKey="ai-riddles" />
        
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
              <span className="text-2xl font-bold text-purple-600">{riddles.length}</span>
              <span className="text-sm text-gray-600">Total Riddles</span>
            </div>
          </div>
        </div>

        {/* Filters & AI Generation */}
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex flex-wrap gap-3">
              <select
                className="border border-gray-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-purple-500"
                value={difficulty}
                onChange={e => setDifficulty(e.target.value)}
              >
                {difficulties.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <select
                className="border border-gray-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-purple-500"
                value={category}
                onChange={e => setCategory(e.target.value)}
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            
            <button
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={generateNewRiddle}
              disabled={isGenerating}
            >
              {isGenerating ? '🤖 Generating...' : '🤖 Generate New Riddle'}
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Riddle Card */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {currentRiddle.difficulty && (
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      currentRiddle.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                      currentRiddle.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {currentRiddle.difficulty}
                    </span>
                  )}
                  {currentRiddle.category && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      {currentRiddle.category}
                    </span>
                  )}
                </div>
                <span className="text-sm text-gray-500">
                  Points: {getPointsForRiddle(currentRiddle, hintsUsed)}
                </span>
              </div>
              
              <div className="text-xl leading-relaxed text-gray-800 bg-gray-50 p-4 rounded-lg">
                {currentRiddle.q}
              </div>
              
              {showHint && currentRiddle.hint && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded transition-all duration-300">
                  <div className="flex items-center">
                    <span className="text-yellow-600 text-sm font-medium">💡 Hint:</span>
                  </div>
                  <p className="text-yellow-800 mt-1">{currentRiddle.hint}</p>
                </div>
              )}
              
              {showAnswer && (
                <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded transition-all duration-300">
                  <div className="flex items-center">
                    <span className="text-green-600 text-sm font-medium">✅ Answer:</span>
                  </div>
                  <p className="text-green-800 mt-1 font-semibold">{currentRiddle.a}</p>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                {!showHint && currentRiddle.hint && (
                  <button
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200"
                    onClick={onHint}
                  >
                    💡 Get Hint (-5 pts)
                  </button>
                )}
                <button
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200"
                  onClick={() => setShowAnswer(s => !s)}
                >
                  {showAnswer ? '🙈 Hide Answer' : '👁️ Reveal Answer'}
                </button>
                <button
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200"
                  onClick={onCorrect}
                >
                  ✅ I Solved It!
                </button>
                <button
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200"
                  onClick={onSkip}
                >
                  ⏭️ Skip
                </button>
              </div>
              
              {totalScore > 0 && (
                <button
                  className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 mt-4"
                  onClick={submit}
                >
                  🏆 Submit Score ({totalScore} points)
                </button>
              )}
            </div>
          </div>
          
          {/* Leaderboard */}
          <div className="bg-white rounded-2xl shadow-lg p-4">
            <Leaderboard gameKey="ai-riddles" />
          </div>
        </div>
      </div>
    </div>
  )
}