import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { submitScore } from "../lib/scores";
import Leaderboard from "../components/Leaderboard";

const WORDS = [
  "REACT", "GAMES", "MUSIC", "BRAIN", "CHESS", "PUZZLE", "SMART", "THINK",
  "LOGIC", "GUESS", "WORDS", "HAPPY", "SUNNY", "CLOUD", "WATER", "EARTH",
  "LIGHT", "POWER", "MAGIC", "DREAM", "PEACE", "HEART", "SMILE", "LAUGH",
  "DANCE", "PARTY", "BEACH", "OCEAN", "RIVER", "HOUSE", "TOWER", "SPACE"
];

const MAX_GUESSES = 6;

export default function Wordle() {
  const { user } = useAuth();
  const [targetWord] = useState(() => WORDS[Math.floor(Math.random() * WORDS.length)]);
  const [guesses, setGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [gameStatus, setGameStatus] = useState("playing"); // playing, won, lost
  const [scoreSubmitted, setScoreSubmitted] = useState(false);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (gameStatus !== "playing") return;

      if (e.key === "Enter") {
        submitGuess();
      } else if (e.key === "Backspace") {
        setCurrentGuess(prev => prev.slice(0, -1));
      } else if (/^[A-Za-z]$/.test(e.key) && currentGuess.length < 5) {
        setCurrentGuess(prev => (prev + e.key.toUpperCase()).slice(0, 5));
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentGuess, gameStatus]);

  const submitGuess = async () => {
    if (currentGuess.length !== 5) return;
    
    const newGuesses = [...guesses, currentGuess];
    setGuesses(newGuesses);
    
    if (currentGuess === targetWord) {
      setGameStatus("won");
      if (user && !scoreSubmitted) {
        const score = Math.max(10, 60 - (newGuesses.length * 10)); // Higher score for fewer guesses
        await submitScore({ 
          uid: user.uid, 
          displayName: user.displayName || user.email, 
          gameKey: "wordle", 
          score 
        });
        setScoreSubmitted(true);
      }
    } else if (newGuesses.length >= MAX_GUESSES) {
      setGameStatus("lost");
      if (user && !scoreSubmitted) {
        await submitScore({ 
          uid: user.uid, 
          displayName: user.displayName || user.email, 
          gameKey: "wordle", 
          score: 5 // Participation points
        });
        setScoreSubmitted(true);
      }
    }
    
    setCurrentGuess("");
  };

  const getLetterStatus = (letter, position, word) => {
    if (targetWord[position] === letter) {
      return "correct"; // Green
    } else if (targetWord.includes(letter)) {
      return "present"; // Yellow
    } else {
      return "absent"; // Gray
    }
  };

  const resetGame = () => {
    const newWord = WORDS[Math.floor(Math.random() * WORDS.length)];
    // We can't change targetWord state directly, so we'll refresh the page
    window.location.reload();
  };

  const renderGuessRow = (guess, isCurrentGuess = false) => {
    const letters = guess.split("").concat(Array(5 - guess.length).fill(""));
    
    return (
      <div className="flex gap-2 justify-center">
        {letters.map((letter, index) => {
          let className = "w-12 h-12 border-2 flex items-center justify-center text-lg font-bold rounded";
          
          if (isCurrentGuess) {
            className += letter ? " border-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" : " border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800";
          } else if (guess.length === 5) {
            const status = getLetterStatus(letter, index, guess);
            if (status === "correct") {
              className += " bg-green-500 border-green-500 text-white";
            } else if (status === "present") {
              className += " bg-yellow-500 border-yellow-500 text-white";
            } else {
              className += " bg-gray-500 border-gray-500 text-white";
            }
          } else {
            className += " border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white";
          }
          
          return (
            <div key={index} className={className}>
              {letter}
            </div>
          );
        })}
      </div>
    );
  };

  const renderKeyboard = () => {
    const topRow = "QWERTYUIOP".split("");
    const middleRow = "ASDFGHJKL".split("");
    const bottomRow = "ZXCVBNM".split("");
    
    const getKeyStatus = (letter) => {
      for (const guess of guesses) {
        if (guess.includes(letter)) {
          const positions = guess.split("").map((l, i) => l === letter ? i : -1).filter(i => i !== -1);
          for (const pos of positions) {
            const status = getLetterStatus(letter, pos, guess);
            if (status === "correct") return "correct";
            if (status === "present") return "present";
          }
          return "absent";
        }
      }
      return "unused";
    };

    const renderKey = (letter) => {
      const status = getKeyStatus(letter);
      let className = "px-3 py-4 rounded font-semibold text-sm min-w-[2.5rem] cursor-pointer transition-colors ";
      
      switch (status) {
        case "correct":
          className += "bg-green-500 text-white";
          break;
        case "present":
          className += "bg-yellow-500 text-white";
          break;
        case "absent":
          className += "bg-gray-500 text-white";
          break;
        default:
          className += "bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-900 dark:text-white";
      }
      
      return (
        <button
          key={letter}
          className={className}
          onClick={() => {
            if (gameStatus === "playing" && currentGuess.length < 5) {
              setCurrentGuess(prev => prev + letter);
            }
          }}
        >
          {letter}
        </button>
      );
    };

    return (
      <div className="space-y-2">
        <div className="flex gap-1 justify-center">{topRow.map(renderKey)}</div>
        <div className="flex gap-1 justify-center">{middleRow.map(renderKey)}</div>
        <div className="flex gap-1 justify-center">
          <button
            className="px-3 py-4 rounded font-semibold text-sm bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-900 dark:text-white cursor-pointer"
            onClick={() => submitGuess()}
          >
            ENTER
          </button>
          {bottomRow.map(renderKey)}
          <button
            className="px-3 py-4 rounded font-semibold text-sm bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-900 dark:text-white cursor-pointer"
            onClick={() => setCurrentGuess(prev => prev.slice(0, -1))}
          >
            ⌫
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent mb-2">
              📝 Wordle
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Guess the 5-letter word in {MAX_GUESSES} tries!
            </p>
          </div>

          {/* Game Area */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
            {gameStatus === "playing" ? (
              <div className="space-y-6">
                {/* Progress */}
                <div className="text-center">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    Guess {guesses.length + 1} of {MAX_GUESSES}
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${((guesses.length + 1) / MAX_GUESSES) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Guesses Grid */}
                <div className="space-y-2">
                  {guesses.map((guess, index) => (
                    <div key={index}>
                      {renderGuessRow(guess)}
                    </div>
                  ))}
                  {guesses.length < MAX_GUESSES && renderGuessRow(currentGuess, true)}
                  {Array(Math.max(0, MAX_GUESSES - guesses.length - 1)).fill().map((_, index) => (
                    <div key={`empty-${index}`}>
                      {renderGuessRow("")}
                    </div>
                  ))}
                </div>

                {/* Instructions */}
                <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                  Type your guess and press ENTER. Use keyboard or on-screen keys.
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="text-6xl mb-4">
                  {gameStatus === "won" ? "🎉" : "😔"}
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                  {gameStatus === "won" ? "Congratulations!" : "Game Over"}
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                  The word was: <span className="font-bold text-orange-600">{targetWord}</span>
                </p>
                {gameStatus === "won" && (
                  <div className="bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 rounded-lg p-4">
                    <p className="text-lg font-semibold text-gray-800 dark:text-white">
                      Solved in {guesses.length} guess{guesses.length !== 1 ? 'es' : ''}!
                    </p>
                  </div>
                )}
                
                <button
                  onClick={resetGame}
                  className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors"
                >
                  Play Again
                </button>
              </div>
            )}
          </div>

          {/* Keyboard */}
          {gameStatus === "playing" && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 mb-6">
              {renderKeyboard()}
            </div>
          )}

          {/* Leaderboard */}
          <Leaderboard gameKey="wordle" />
        </div>
      </div>
    </div>
  );
}