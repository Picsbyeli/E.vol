import { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { submitScore } from "../lib/scores";
import Leaderboard from "../components/Leaderboard";

// Sample animals data (you can expand this)
const ANIMALS = [
  { name: "Dog", mammal: true, bird: false, water: false, flies: false, pet: true, predator: false, big: false, hooves: false },
  { name: "Cat", mammal: true, bird: false, water: false, flies: false, pet: true, predator: true, big: false, hooves: false },
  { name: "Eagle", mammal: false, bird: true, water: false, flies: true, pet: false, predator: true, big: false, hooves: false },
  { name: "Whale", mammal: true, bird: false, water: true, flies: false, pet: false, predator: true, big: true, hooves: false },
  { name: "Horse", mammal: true, bird: false, water: false, flies: false, pet: false, predator: false, big: true, hooves: true },
  { name: "Goldfish", mammal: false, bird: false, water: true, flies: false, pet: true, predator: false, big: false, hooves: false },
  { name: "Lion", mammal: true, bird: false, water: false, flies: false, pet: false, predator: true, big: true, hooves: false },
  { name: "Elephant", mammal: true, bird: false, water: false, flies: false, pet: false, predator: false, big: true, hooves: false },
  { name: "Penguin", mammal: false, bird: true, water: true, flies: false, pet: false, predator: false, big: false, hooves: false },
  { name: "Shark", mammal: false, bird: false, water: true, flies: false, pet: false, predator: true, big: true, hooves: false },
];

const QUESTIONS = [
  { key: "mammal", text: "Is it a mammal?" },
  { key: "bird", text: "Is it a bird?" },
  { key: "water", text: "Does it live in water?" },
  { key: "flies", text: "Can it fly?" },
  { key: "pet", text: "Is it commonly a pet?" },
  { key: "predator", text: "Is it a predator?" },
  { key: "big", text: "Is it bigger than a person?" },
  { key: "hooves", text: "Does it have hooves?" },
];

export default function TwentyQuestions() {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [gameOver, setGameOver] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);

  const candidates = useMemo(() => {
    return ANIMALS.filter((animal) => {
      for (const [key, value] of Object.entries(answers)) {
        if (value === "skip") continue;
        if (Boolean(animal[key]) !== (value === "yes")) return false;
      }
      return true;
    });
  }, [answers]);

  const currentQuestion = QUESTIONS[step];
  const isFinished = step >= QUESTIONS.length || candidates.length <= 1;
  const finalScore = Math.max(0, 25 - step); // Higher score for fewer questions

  const handleAnswer = async (answer) => {
    if (isFinished && !gameOver) {
      setGameOver(true);
      if (user && !scoreSubmitted) {
        try {
          await submitScore({ 
            uid: user.uid, 
            displayName: user.displayName || user.email, 
            gameKey: "twenty-questions", 
            score: finalScore 
          });
          setScoreSubmitted(true);
        } catch (error) {
          console.error('Failed to submit score:', error);
        }
      }
      return;
    }

    if (currentQuestion) {
      setAnswers(prev => ({ ...prev, [currentQuestion.key]: answer }));
      setStep(prev => prev + 1);
    }
  };

  const resetGame = () => {
    setStep(0);
    setAnswers({});
    setGameOver(false);
    setScoreSubmitted(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
              🤔 Twenty Questions
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Think of an animal, and I'll try to guess it in 20 questions!
            </p>
          </div>

          {/* Game Area */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
            {!gameOver ? (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    Question {step + 1} of {QUESTIONS.length}
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${((step + 1) / QUESTIONS.length) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {currentQuestion && (
                  <div className="text-center">
                    <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">
                      {currentQuestion.text}
                    </h2>
                    
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <button
                        onClick={() => handleAnswer("yes")}
                        className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => handleAnswer("no")}
                        className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors"
                      >
                        No
                      </button>
                      <button
                        onClick={() => handleAnswer("skip")}
                        className="px-8 py-3 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
                      >
                        Skip
                      </button>
                    </div>
                  </div>
                )}

                <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                  Possible animals remaining: <span className="font-semibold text-blue-600">{candidates.length}</span>
                </div>

                {candidates.length <= 3 && candidates.length > 1 && (
                  <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
                    <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-2">
                      Getting close! Remaining candidates:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {candidates.map((animal, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded text-sm">
                          {animal.name}
                        </span>
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
                <p className="text-lg text-gray-600 dark:text-gray-300">
                  I think your animal is: <span className="font-bold text-blue-600">
                    {candidates.length > 0 ? candidates[0].name : "Unknown"}
                  </span>
                </p>
                <div className="bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30 rounded-lg p-4">
                  <p className="text-lg font-semibold text-gray-800 dark:text-white">
                    Your Score: <span className="text-green-600">{finalScore} points</span>
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Questions used: {step} / {QUESTIONS.length}
                  </p>
                </div>
                
                <button
                  onClick={resetGame}
                  className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors"
                >
                  Play Again
                </button>
              </div>
            )}
          </div>

          {/* Leaderboard */}
          <Leaderboard gameKey="twenty-questions" />
        </div>
      </div>
    </div>
  );
}