import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { submitScore } from "../lib/scores";
import Leaderboard from "../components/Leaderboard";

// Generate a simple Sudoku puzzle
function generateSudokuPuzzle() {
  // Simple 9x9 grid with some pre-filled numbers for a basic puzzle
  const puzzle = [
    [5, 3, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 1, 9, 5, 0, 0, 0],
    [0, 9, 8, 0, 0, 0, 0, 6, 0],
    [8, 0, 0, 0, 6, 0, 0, 0, 3],
    [4, 0, 0, 8, 0, 3, 0, 0, 1],
    [7, 0, 0, 0, 2, 0, 0, 0, 6],
    [0, 6, 0, 0, 0, 0, 2, 8, 0],
    [0, 0, 0, 4, 1, 9, 0, 0, 5],
    [0, 0, 0, 0, 8, 0, 0, 7, 9]
  ];
  return puzzle;
}

// Check if a number is valid in a given position
function isValidMove(board, row, col, num) {
  // Check row
  for (let x = 0; x < 9; x++) {
    if (board[row][x] === num) return false;
  }

  // Check column
  for (let x = 0; x < 9; x++) {
    if (board[x][col] === num) return false;
  }

  // Check 3x3 box
  const startRow = row - (row % 3);
  const startCol = col - (col % 3);
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[i + startRow][j + startCol] === num) return false;
    }
  }

  return true;
}

// Check if the puzzle is complete
function isPuzzleComplete(board) {
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      if (board[i][j] === 0) return false;
    }
  }
  return true;
}

export default function Sudoku() {
  const { user } = useAuth();
  const [initialPuzzle] = useState(generateSudokuPuzzle);
  const [board, setBoard] = useState(() => initialPuzzle.map(row => [...row]));
  const [gameComplete, setGameComplete] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const [startTime] = useState(Date.now());

  const handleCellChange = (row, col, value) => {
    // Don't allow changes to initial puzzle cells
    if (initialPuzzle[row][col] !== 0) return;

    const numValue = value === '' ? 0 : parseInt(value);
    if (isNaN(numValue) || numValue < 0 || numValue > 9) return;

    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = numValue;

    // Check for errors
    const newErrors = { ...errors };
    const errorKey = `${row}-${col}`;

    if (numValue !== 0 && !isValidMove(board, row, col, numValue)) {
      newErrors[errorKey] = true;
    } else {
      delete newErrors[errorKey];
    }

    setBoard(newBoard);
    setErrors(newErrors);

    // Check if puzzle is complete
    if (Object.keys(newErrors).length === 0 && isPuzzleComplete(newBoard)) {
      setGameComplete(true);
      if (user && !scoreSubmitted) {
        const timeBonus = Math.max(0, 1000 - Math.floor((Date.now() - startTime) / 1000));
        const finalScore = 100 + timeBonus;
        submitScore({ 
          uid: user.uid, 
          displayName: user.displayName || user.email, 
          gameKey: "sudoku", 
          score: finalScore 
        });
        setScoreSubmitted(true);
      }
    }
  };

  const resetGame = () => {
    setBoard(initialPuzzle.map(row => [...row]));
    setGameComplete(false);
    setScoreSubmitted(false);
    setErrors({});
  };

  const getFilledCells = () => {
    return board.flat().filter(cell => cell !== 0).length;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
              🧩 Sudoku
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Fill the grid so that every row, column, and 3×3 box contains the digits 1-9
            </p>
          </div>

          {/* Game Area */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
            {!gameComplete ? (
              <div className="space-y-6">
                {/* Progress */}
                <div className="text-center">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    Progress: {getFilledCells()} / 81 cells filled
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(getFilledCells() / 81) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Sudoku Grid */}
                <div className="flex justify-center">
                  <div className="grid grid-cols-9 gap-1 bg-gray-800 p-2 rounded-lg">
                    {board.map((row, rowIndex) =>
                      row.map((cell, colIndex) => {
                        const isInitial = initialPuzzle[rowIndex][colIndex] !== 0;
                        const hasError = errors[`${rowIndex}-${colIndex}`];
                        const isInThickBorder = (rowIndex % 3 === 2 && rowIndex !== 8) || (colIndex % 3 === 2 && colIndex !== 8);
                        
                        return (
                          <input
                            key={`${rowIndex}-${colIndex}`}
                            type="text"
                            value={cell === 0 ? '' : cell}
                            onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                            className={`
                              w-8 h-8 text-center text-lg font-semibold border-2 rounded
                              ${isInitial 
                                ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 cursor-not-allowed' 
                                : 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white'
                              }
                              ${hasError 
                                ? 'border-red-500 bg-red-50 dark:bg-red-900/30' 
                                : 'border-gray-300 dark:border-gray-500'
                              }
                              ${isInThickBorder ? 'border-r-4 border-b-4' : ''}
                              focus:outline-none focus:ring-2 focus:ring-blue-500
                            `}
                            maxLength={1}
                            readOnly={isInitial}
                          />
                        );
                      })
                    )}
                  </div>
                </div>

                {Object.keys(errors).length > 0 && (
                  <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-3">
                    <p className="text-red-800 dark:text-red-200 text-sm">
                      ⚠️ Some numbers conflict with Sudoku rules. Check highlighted cells.
                    </p>
                  </div>
                )}

                <button
                  onClick={resetGame}
                  className="w-full px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
                >
                  Reset Puzzle
                </button>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                  Congratulations!
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                  You solved the Sudoku puzzle!
                </p>
                <div className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-lg p-4">
                  <p className="text-lg font-semibold text-gray-800 dark:text-white">
                    Time: {Math.floor((Date.now() - startTime) / 1000)} seconds
                  </p>
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
          <Leaderboard gameKey="sudoku" />
        </div>
      </div>
    </div>
  );
}