import { useState, useEffect } from 'react'
import { useAuth } from '../main'
import { submitScore } from '../lib/scores'
import StatsHeader from '../components/StatsHeader'
import Leaderboard from '../components/Leaderboard'
import wordsData from '../data/words.json'

export default function WordGame() {
  const { user } = useAuth()
  const [currentWord, setCurrentWord] = useState('')
  const [guessedLetters, setGuessedLetters] = useState(new Set())
  const [wrongGuesses, setWrongGuesses] = useState(0)
  const [gameWon, setGameWon] = useState(false)
  const [gameLost, setGameLost] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [currentWordData, setCurrentWordData] = useState(null)
  
  const maxWrongGuesses = 6
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
  
  const newGame = () => {
    const wordData = wordsData[Math.floor(Math.random() * wordsData.length)]
    setCurrentWord(wordData.word)
    setCurrentWordData(wordData)
    setGuessedLetters(new Set())
    setWrongGuesses(0)
    setGameWon(false)
    setGameLost(false)
    setShowHint(false)
  }
  
  useEffect(() => {
    newGame()
  }, [])
  
  useEffect(() => {
    if (!currentWord) return
    
    const uniqueLetters = new Set(currentWord.split(''))
    const correctGuesses = [...guessedLetters].filter(letter => 
      currentWord.includes(letter)
    )
    
    if (correctGuesses.length === uniqueLetters.size && currentWord) {
      setGameWon(true)
      const points = calculatePoints()
      setScore(s => s + points)
      setStreak(s => s + 1)
    }
    
    if (wrongGuesses >= maxWrongGuesses) {
      setGameLost(true)
      setStreak(0)
    }
  }, [guessedLetters, wrongGuesses, currentWord])
  
  const calculatePoints = () => {
    const basePoints = { Easy: 10, Medium: 20, Hard: 30 }[currentWordData?.difficulty] || 10
    const hintPenalty = showHint ? 5 : 0
    const wrongPenalty = wrongGuesses * 2
    return Math.max(1, basePoints - hintPenalty - wrongPenalty)
  }
  
  const guessLetter = (letter) => {
    if (guessedLetters.has(letter) || gameWon || gameLost) return
    
    const newGuessed = new Set(guessedLetters)
    newGuessed.add(letter)
    setGuessedLetters(newGuessed)
    
    if (!currentWord.includes(letter)) {
      setWrongGuesses(w => w + 1)
    }
  }
  
  const displayWord = () => {
    return currentWord.split('').map(letter => 
      guessedLetters.has(letter) ? letter : '_'
    ).join(' ')
  }
  
  const submitGameScore = async () => {
    if (!user || score === 0) return
    await submitScore({
      uid: user.uid,
      displayName: user.displayName || user.email,
      gameKey: 'word-game',
      score: score,
    })
    alert(`Score of ${score} submitted!`)
    setScore(0)
    setStreak(0)
  }
  
  const hangmanStages = [
    '', '😵', '😵‍💫', '🤕', '😖', '😭', '💀'
  ]
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="mx-auto max-w-4xl p-4 space-y-6">
        <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
          🔤 Word Guessing Game
        </h1>
        
        <StatsHeader gameKey="word-game" />
        
        {/* Game Stats */}
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <div className="flex flex-wrap justify-center gap-6 text-center">
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-green-600">{streak}</span>
              <span className="text-sm text-gray-600">Streak</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-blue-600">{score}</span>
              <span className="text-sm text-gray-600">Session Score</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl">{hangmanStages[wrongGuesses]}</span>
              <span className="text-sm text-gray-600">Wrong: {wrongGuesses}/{maxWrongGuesses}</span>
            </div>
          </div>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Game */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
              {currentWordData && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      currentWordData.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                      currentWordData.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {currentWordData.difficulty}
                    </span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      {currentWordData.category}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    Points: {calculatePoints()}
                  </span>
                </div>
              )}
              
              {/* Word Display */}
              <div className="text-center">
                <div className="text-4xl font-mono font-bold tracking-widest text-gray-800 bg-gray-50 p-6 rounded-lg">
                  {displayWord()}
                </div>
              </div>
              
              {/* Hint */}
              {showHint && currentWordData && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                  <div className="flex items-center">
                    <span className="text-yellow-600 text-sm font-medium">💡 Hint:</span>
                  </div>
                  <p className="text-yellow-800 mt-1">{currentWordData.hint}</p>
                </div>
              )}
              
              {/* Game Status */}
              {gameWon && (
                <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
                  <p className="text-green-800 font-semibold">🎉 Congratulations! You won! +{calculatePoints()} points</p>
                </div>
              )}
              
              {gameLost && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
                  <p className="text-red-800 font-semibold">💀 Game Over! The word was: <span className="font-bold">{currentWord}</span></p>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 justify-center">
                {!showHint && !gameWon && !gameLost && (
                  <button
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200"
                    onClick={() => setShowHint(true)}
                  >
                    💡 Show Hint (-5 pts)
                  </button>
                )}
                
                <button
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200"
                  onClick={newGame}
                >
                  🎲 New Word
                </button>
                
                {score > 0 && (
                  <button
                    className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200"
                    onClick={submitGameScore}
                  >
                    🏆 Submit Score ({score} pts)
                  </button>
                )}
              </div>
              
              {/* Alphabet */}
              <div className="grid grid-cols-6 sm:grid-cols-9 gap-2">
                {alphabet.map(letter => {
                  const guessed = guessedLetters.has(letter)
                  const correct = guessed && currentWord.includes(letter)
                  const wrong = guessed && !currentWord.includes(letter)
                  
                  return (
                    <button
                      key={letter}
                      className={`p-3 rounded-lg font-bold transition-all duration-200 ${
                        correct ? 'bg-green-500 text-white' :
                        wrong ? 'bg-red-500 text-white' :
                        'bg-gray-200 hover:bg-gray-300 text-gray-700'
                      } ${(gameWon || gameLost || guessed) ? 'cursor-not-allowed opacity-50' : 'hover:scale-105'}`}
                      onClick={() => guessLetter(letter)}
                      disabled={gameWon || gameLost || guessed}
                    >
                      {letter}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
          
          {/* Leaderboard */}
          <div className="bg-white rounded-2xl shadow-lg p-4">
            <Leaderboard gameKey="word-game" />
          </div>
        </div>
      </div>
    </div>
  )
}