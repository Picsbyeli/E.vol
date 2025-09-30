import { useState, useEffect } from 'react'
import { useAuth } from '../main'
import { submitScore } from '../lib/scores'
import StatsHeader from '../components/StatsHeader'
import Leaderboard from '../components/Leaderboard'
import emojiData from '../data/emojis.json'

export default function EmojiGuess() {
  const { user } = useAuth()
  const [currentPuzzle, setCurrentPuzzle] = useState(null)
  const [userGuess, setUserGuess] = useState('')
  const [showAnswer, setShowAnswer] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const [gameStatus, setGameStatus] = useState('playing') // 'playing', 'correct', 'revealed'
  
  const maxAttempts = 3
  
  const newPuzzle = () => {
    const puzzle = emojiData[Math.floor(Math.random() * emojiData.length)]
    setCurrentPuzzle(puzzle)
    setUserGuess('')
    setShowAnswer(false)
    setShowHint(false)
    setAttempts(0)
    setGameStatus('playing')
  }
  
  useEffect(() => {
    newPuzzle()
  }, [])
  
  const calculatePoints = () => {
    if (!currentPuzzle) return 0
    const basePoints = { Easy: 15, Medium: 25, Hard: 40 }[currentPuzzle.difficulty] || 15
    const hintPenalty = showHint ? 5 : 0
    const attemptPenalty = attempts * 3
    return Math.max(1, basePoints - hintPenalty - attemptPenalty)
  }
  
  const checkAnswer = () => {
    if (!currentPuzzle || !userGuess.trim()) return
    
    const normalizedGuess = userGuess.toUpperCase().trim()
    const normalizedAnswer = currentPuzzle.answer.toUpperCase().trim()
    
    if (normalizedGuess === normalizedAnswer) {
      setGameStatus('correct')
      const points = calculatePoints()
      setScore(s => s + points)
      setStreak(s => s + 1)
    } else {
      setAttempts(a => a + 1)
      if (attempts + 1 >= maxAttempts) {
        setShowAnswer(true)
        setGameStatus('revealed')
        setStreak(0)
      }
    }
  }
  
  const submitGameScore = async () => {
    if (!user || score === 0) return
    await submitScore({
      uid: user.uid,
      displayName: user.displayName || user.email,
      gameKey: 'emoji-guess',
      score: score,
    })
    alert(`Score of ${score} submitted!`)
    setScore(0)
    setStreak(0)
  }
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && gameStatus === 'playing') {
      checkAnswer()
    }
  }
  
  if (!currentPuzzle) return <div>Loading...</div>
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-orange-50">
      <div className="mx-auto max-w-4xl p-4 space-y-6">
        <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">
          😄 Emoji Guessing Game
        </h1>
        
        <StatsHeader gameKey="emoji-guess" />
        
        {/* Game Stats */}
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <div className="flex flex-wrap justify-center gap-6 text-center">
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-pink-600">{streak}</span>
              <span className="text-sm text-gray-600">Streak</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-orange-600">{score}</span>
              <span className="text-sm text-gray-600">Session Score</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-purple-600">{attempts}/{maxAttempts}</span>
              <span className="text-sm text-gray-600">Attempts</span>
            </div>
          </div>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Game */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    currentPuzzle.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                    currentPuzzle.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {currentPuzzle.difficulty}
                  </span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    {currentPuzzle.category}
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  Points: {calculatePoints()}
                </span>
              </div>
              
              {/* Emoji Display */}
              <div className="text-center">
                <div className="text-8xl mb-4 p-6 bg-gray-50 rounded-2xl">
                  {currentPuzzle.emojis}
                </div>
                <p className="text-lg text-gray-600">Guess what these emojis represent!</p>
              </div>
              
              {/* Hint */}
              {showHint && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                  <div className="flex items-center">
                    <span className="text-yellow-600 text-sm font-medium">💡 Hint:</span>
                  </div>
                  <p className="text-yellow-800 mt-1">{currentPuzzle.hint}</p>
                </div>
              )}
              
              {/* Answer Input */}
              {gameStatus === 'playing' && (
                <div className="space-y-4">
                  <input
                    type="text"
                    className="w-full p-4 text-lg border-2 border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none transition-colors"
                    placeholder="Enter your guess..."
                    value={userGuess}
                    onChange={(e) => setUserGuess(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                  <div className="flex gap-2 justify-center">
                    <button
                      className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
                      onClick={checkAnswer}
                      disabled={!userGuess.trim()}
                    >
                      🎯 Submit Guess
                    </button>
                    {!showHint && (
                      <button
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200"
                        onClick={() => setShowHint(true)}
                      >
                        💡 Show Hint (-5 pts)
                      </button>
                    )}
                  </div>
                </div>
              )}
              
              {/* Game Status */}
              {gameStatus === 'correct' && (
                <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
                  <p className="text-green-800 font-semibold">
                    🎉 Correct! The answer was: <span className="font-bold">{currentPuzzle.answer}</span>
                  </p>
                  <p className="text-green-700 mt-1">+{calculatePoints()} points</p>
                </div>
              )}
              
              {showAnswer && gameStatus === 'revealed' && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
                  <p className="text-red-800 font-semibold">
                    😔 Out of attempts! The answer was: <span className="font-bold">{currentPuzzle.answer}</span>
                  </p>
                </div>
              )}
              
              {attempts > 0 && attempts < maxAttempts && gameStatus === 'playing' && (
                <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded">
                  <p className="text-orange-800">
                    ❌ Try again! {maxAttempts - attempts} attempts remaining
                  </p>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200"
                  onClick={newPuzzle}
                >
                  🎲 New Puzzle
                </button>
                
                {gameStatus !== 'playing' && !showAnswer && (
                  <button
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200"
                    onClick={() => setShowAnswer(true)}
                  >
                    👁️ Show Answer
                  </button>
                )}
                
                {score > 0 && (
                  <button
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200"
                    onClick={submitGameScore}
                  >
                    🏆 Submit Score ({score} pts)
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Leaderboard */}
          <div className="bg-white rounded-2xl shadow-lg p-4">
            <Leaderboard gameKey="emoji-guess" />
          </div>
        </div>
      </div>
    </div>
  )
}