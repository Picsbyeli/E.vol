import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { submitScore } from "../lib/scores";
import Leaderboard from "../components/Leaderboard";

const BURBLE_QUESTIONS = [
  { 
    q: "I have keys but no locks, space but no room. What am I?", 
    a: "KEYBOARD",
    category: "Technology",
    hint: "You're probably using one right now!"
  },
  { 
    q: "What has hands but cannot clap?", 
    a: "CLOCK",
    category: "Objects",
    hint: "It helps you tell time"
  },
  {
    q: "I can fly without wings. I can cry without eyes. What am I?",
    a: "CLOUD",
    category: "Nature",
    hint: "Look up in the sky"
  },
  {
    q: "The more you take, the more you leave behind. What am I?",
    a: "FOOTSTEPS",
    category: "Logic",
    hint: "Think about walking"
  },
  {
    q: "I have a head and a tail, but no body. What am I?",
    a: "COIN",
    category: "Objects",
    hint: "Found in your wallet"
  },
  {
    q: "What gets wet while drying?",
    a: "TOWEL",
    category: "Objects",
    hint: "Used after a shower"
  },
  {
    q: "I'm tall when I'm young, short when I'm old. What am I?",
    a: "CANDLE",
    category: "Objects",
    hint: "Provides light and melts"
  },
  {
    q: "What has one eye but cannot see?",
    a: "NEEDLE",
    category: "Objects",
    hint: "Used for sewing"
  },
  {
    q: "I have branches, but no fruit, trunk, or leaves. What am I?",
    a: "BANK",
    category: "Places",
    hint: "Where you keep money"
  },
  {
    q: "What travels around the world but stays in one spot?",
    a: "STAMP",
    category: "Objects",
    hint: "Found on mail"
  }
];

export default function Burble() {
  const { user } = useAuth();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [guess, setGuess] = useState("");
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState([]);

  const currentQuestion = BURBLE_QUESTIONS[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex >= BURBLE_QUESTIONS.length - 1;

  const submitGuess = async () => {
    if (!guess.trim()) return;

    const isCorrect = guess.toUpperCase().trim() === currentQuestion.a;
    const points = isCorrect ? (showHint ? 5 : 10) : 0;
    
    const questionResult = {
      question: currentQuestion.q,
      answer: currentQuestion.a,
      guess: guess.toUpperCase().trim(),
      correct: isCorrect,
      points,
      hintUsed: showHint
    };

    setAnsweredQuestions(prev => [...prev, questionResult]);

    if (isCorrect) {
      setScore(prevScore => prevScore + points);
    }

    setGuess("");
    setShowHint(false);

    if (isLastQuestion) {
      setGameOver(true);
      if (user && !scoreSubmitted) {
        const finalScore = score + points;
        await submitScore({ 
          uid: user.uid, 
          displayName: user.displayName || user.email, 
          gameKey: "burble", 
          score: finalScore 
        });
        setScoreSubmitted(true);
      }
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const useHint = () => {
    setShowHint(true);
  };

  const resetGame = () => {
    setCurrentQuestionIndex(0);
    setGuess("");
    setScore(0);
    setGameOver(false);
    setScoreSubmitted(false);
    setShowHint(false);
    setAnsweredQuestions([]);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      submitGuess();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
              🎭 Burble Game
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Solve riddles and word puzzles to score points!
            </p>
          </div>

          {/* Game Area */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
            {!gameOver ? (
              <div className="space-y-6">
                {/* Progress */}
                <div className="text-center">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    Question {currentQuestionIndex + 1} of {BURBLE_QUESTIONS.length}
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${((currentQuestionIndex + 1) / BURBLE_QUESTIONS.length) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Current Score */}
                <div className="text-center">
                  <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 rounded-lg">
                    <span className="text-lg font-semibold text-gray-800 dark:text-white">
                      Score: {score} points
                    </span>
                  </div>
                </div>

                {/* Question */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200 text-xs font-medium rounded">
                      {currentQuestion.category}
                    </span>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                    {currentQuestion.q}
                  </h2>
                  
                  {showHint && (
                    <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded p-3 mb-4">
                      <p className="text-blue-800 dark:text-blue-200 text-sm">
                        💡 Hint: {currentQuestion.hint}
                      </p>
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="space-y-3">
                  <input
                    type="text"
                    value={guess}
                    onChange={(e) => setGuess(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter your answer..."
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  
                  <div className="flex gap-3">
                    <button
                      onClick={submitGuess}
                      disabled={!guess.trim()}
                      className="flex-1 px-6 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
                    >
                      Submit Answer
                    </button>
                    
                    {!showHint && (
                      <button
                        onClick={useHint}
                        className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors"
                      >
                        Hint (-5 pts)
                      </button>
                    )}
                  </div>
                </div>

                {/* Answer History */}
                {answeredQuestions.length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Previous Answers:</h3>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {answeredQuestions.slice(-3).map((q, index) => (
                        <div key={index} className={`text-sm p-2 rounded ${
                          q.correct 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' 
                            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                        }`}>
                          <div className="font-medium">{q.guess} {q.correct ? '✓' : '✗'}</div>
                          <div className="text-xs opacity-75">Answer: {q.answer} (+{q.points} pts)</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                  Game Complete!
                </h2>
                <div className="bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 rounded-lg p-6">
                  <p className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                    Final Score: {score} points
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">
                    Correct answers: {answeredQuestions.filter(q => q.correct).length} / {BURBLE_QUESTIONS.length}
                  </p>
                </div>
                
                {/* Game Summary */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 max-h-40 overflow-y-auto">
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Game Summary:</h3>
                  <div className="space-y-1 text-sm">
                    {answeredQuestions.map((q, index) => (
                      <div key={index} className={`p-2 rounded ${
                        q.correct 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' 
                          : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                      }`}>
                        <div className="font-medium">Q{index + 1}: {q.guess} {q.correct ? '✓' : '✗'}</div>
                        <div className="text-xs opacity-75">{q.answer} (+{q.points} pts)</div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <button
                  onClick={resetGame}
                  className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-lg transition-colors"
                >
                  Play Again
                </button>
              </div>
            )}
          </div>

          {/* Leaderboard */}
          <Leaderboard gameKey="burble" />
        </div>
      </div>
    </div>
  );
}