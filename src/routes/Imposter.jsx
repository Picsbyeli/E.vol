import { useEffect, useState } from "react";
import { rtdb } from "../lib/firebase";
import { ref, set, onValue, update, get } from "firebase/database";
import { useAuth } from "../context/AuthContext";
import { submitScore } from "../lib/scores";
import Leaderboard from "../components/Leaderboard";

const WORDS = ["Pizza", "Dog", "Car", "Computer", "Football", "Banana"];

export default function Imposter() {
  const { user } = useAuth();
  const [phase, setPhase] = useState("menu");
  const [lobby, setLobby] = useState(null);
  const [playerName] = useState("Player" + Math.floor(Math.random() * 1000));
  const [currentLobby, setCurrentLobby] = useState(null);

  // Create lobby
  const createLobby = async () => {
    const code = Math.random().toString(36).substring(2, 6).toUpperCase();
    setCurrentLobby(code);
    await set(ref(rtdb, "lobbies/" + code), {
      host: playerName,
      players: { [playerName]: { clue: "", vote: "", score: 0 } },
      phase: "waiting",
      round: 0,
      word: "",
      imposter: "",
    });
    setPhase("game");
    listenLobby(code);
  };

  // Join lobby
  const joinLobby = async (code) => {
    if (!code) return;
    setCurrentLobby(code);
    await set(ref(rtdb, "lobbies/" + code + "/players/" + playerName), {
      clue: "",
      vote: "",
      score: 0,
    });
    setPhase("game");
    listenLobby(code);
  };

  // Listen to lobby updates
  const listenLobby = (code) => {
    onValue(ref(rtdb, "lobbies/" + code), (snap) => {
      setLobby(snap.val());
    });
  };

  // Start round
  const startRound = async () => {
    const word = WORDS[Math.floor(Math.random() * WORDS.length)];
    const snap = await get(ref(rtdb, "lobbies/" + currentLobby));
    const players = Object.keys(snap.val().players);
    const imposter = players[Math.floor(Math.random() * players.length)];
    players.forEach((p) =>
      update(ref(rtdb, `lobbies/${currentLobby}/players/${p}`), { clue: "", vote: "" })
    );
    update(ref(rtdb, "lobbies/" + currentLobby), {
      word,
      imposter,
      phase: "clue",
    });
  };

  // Submit clue
  const submitClue = async (clue) => {
    await update(ref(rtdb, `lobbies/${currentLobby}/players/${playerName}`), { clue });
    const snap = await get(ref(rtdb, "lobbies/" + currentLobby));
    const allGiven = Object.values(snap.val().players).every((p) => p.clue !== "");
    if (allGiven) update(ref(rtdb, "lobbies/" + currentLobby), { phase: "vote" });
  };

  // Submit vote
  const submitVote = async (target) => {
    await update(ref(rtdb, `lobbies/${currentLobby}/players/${playerName}`), { vote: target });
    const snap = await get(ref(rtdb, "lobbies/" + currentLobby));
    const allVoted = Object.values(snap.val().players).every((p) => p.vote !== "");
    if (allVoted) finishVoting(snap.val());
  };

  // Finish voting
  const finishVoting = (lobby) => {
    const voteCount = {};
    for (let p in lobby.players) {
      const v = lobby.players[p].vote;
      if (!voteCount[v]) voteCount[v] = 0;
      voteCount[v]++;
    }
    const accused = Object.keys(voteCount).reduce((a, b) =>
      voteCount[a] > voteCount[b] ? a : b
    );

    if (accused === lobby.imposter) {
      update(ref(rtdb, "lobbies/" + currentLobby), { phase: "imposterGuess", accused });
    } else {
      lobby.players[lobby.imposter].score += 2;
      update(ref(rtdb, "lobbies/" + currentLobby), { players: lobby.players, phase: "results" });
      if (user) submitScore({ uid: user.uid, displayName: user.displayName || user.email, gameKey: "imposter", score: 2 });
    }
  };

  // Imposter guess
  const submitImposterGuess = async (wordGuess) => {
    const snap = await get(ref(rtdb, "lobbies/" + currentLobby));
    const lobby = snap.val();
    const players = lobby.players;
    if (wordGuess.toLowerCase() === lobby.word.toLowerCase()) {
      players[lobby.imposter].score += 3;
      if (user) submitScore({ uid: user.uid, displayName: user.displayName || user.email, gameKey: "imposter", score: 3 });
    } else {
      for (let p in players) {
        if (p !== lobby.imposter) players[p].score++;
      }
      if (user) submitScore({ uid: user.uid, displayName: user.displayName || user.email, gameKey: "imposter", score: 1 });
    }
    update(ref(rtdb, "lobbies/" + currentLobby), { players, phase: "results" });
  };

  // ---------------- UI ----------------
  if (phase === "menu") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-red-50 dark:from-gray-900 dark:via-purple-900 dark:to-red-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-red-600 bg-clip-text text-transparent mb-2">
                🎭 Imposter Game
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Play with friends or bots!
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 space-y-4">
              <button 
                onClick={createLobby} 
                className="w-full py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold text-lg shadow-lg transition-all transform hover:scale-105"
              >
                🎮 Host Game
              </button>
              
              <div className="space-y-3">
                <input 
                  id="joinCode" 
                  placeholder="Enter Lobby Code" 
                  className="w-full p-4 text-lg border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                />
                <button 
                  onClick={() => joinLobby(document.getElementById("joinCode").value)} 
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold text-lg shadow-lg transition-all transform hover:scale-105"
                >
                  🚀 Join Game
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!lobby) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-red-50 dark:from-gray-900 dark:via-purple-900 dark:to-red-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🎭</div>
          <p className="text-xl text-gray-600 dark:text-gray-300">Loading lobby...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-red-50 dark:from-gray-900 dark:via-purple-900 dark:to-red-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-red-600 bg-clip-text text-transparent mb-2">
              🎭 Lobby: {currentLobby}
            </h1>
          </div>

          {/* Players Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 text-center">
              👥 Players
            </h3>
            <div className="space-y-3">
              {Object.entries(lobby.players).map(([name, p]) => (
                <div key={name} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <span className="font-semibold text-gray-800 dark:text-white">{name}</span>
                  <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full font-bold">
                    {p.score} pts
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Waiting Phase */}
          {lobby.phase === "waiting" && lobby.host === playerName && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 text-center">
              <div className="text-4xl mb-4">🎲</div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Ready to Start?</h3>
              <button 
                onClick={startRound} 
                className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold text-lg shadow-lg transition-all transform hover:scale-105"
              >
                🚀 Start Game
              </button>
            </div>
          )}

          {/* Clue Phase */}
          {lobby.phase === "clue" && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 space-y-4">
              <div className="text-center">
                {playerName === lobby.imposter ? (
                  <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-xl">
                    <div className="text-3xl mb-2">🎭</div>
                    <p className="text-red-600 dark:text-red-400 font-bold text-lg">
                      You are the Imposter!
                    </p>
                    <p className="text-red-500 dark:text-red-300">
                      Try to blend in with your clue!
                    </p>
                  </div>
                ) : (
                  <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                    <div className="text-3xl mb-2">💡</div>
                    <p className="text-blue-600 dark:text-blue-400 font-bold text-lg">
                      Secret Word: <span className="text-2xl">{lobby.word}</span>
                    </p>
                    <p className="text-blue-500 dark:text-blue-300">
                      Give a clue without saying the word!
                    </p>
                  </div>
                )}
              </div>
              
              <input 
                id="clueInput" 
                placeholder="Type your clue here..." 
                className="w-full p-4 text-lg border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
              />
              <button 
                onClick={() => submitClue(document.getElementById("clueInput").value)} 
                className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold text-lg shadow-lg transition-all transform hover:scale-105"
              >
                ✍️ Submit Clue
              </button>
            </div>
          )}

          {/* Vote Phase */}
          {lobby.phase === "vote" && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 space-y-4">
              <div className="text-center">
                <div className="text-3xl mb-2">🗳️</div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">Time to Vote!</h3>
                <p className="text-gray-600 dark:text-gray-300">Who is the imposter?</p>
              </div>
              
              {/* Show all clues */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 space-y-2">
                <h4 className="font-bold text-gray-800 dark:text-white text-center mb-3">🔍 Clues</h4>
                {Object.entries(lobby.players).map(([name, p]) => (
                  <div key={name} className="flex justify-between items-center p-2 bg-white dark:bg-gray-600 rounded-lg">
                    <span className="font-semibold text-gray-800 dark:text-white">{name}:</span>
                    <span className="text-gray-700 dark:text-gray-200 italic">"{p.clue}"</span>
                  </div>
                ))}
              </div>
              
              {/* Voting buttons */}
              <div className="space-y-2">
                {Object.keys(lobby.players).filter((p) => p !== playerName).map((p) => (
                  <button 
                    key={p} 
                    onClick={() => submitVote(p)} 
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-bold text-lg shadow-lg transition-all transform hover:scale-105"
                  >
                    👉 Vote {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Imposter Guess Phase */}
          {lobby.phase === "imposterGuess" && playerName === lobby.imposter && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 space-y-4">
              <div className="text-center">
                <div className="text-4xl mb-2">🎯</div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">Last Chance!</h3>
                <p className="text-gray-600 dark:text-gray-300">You were caught! Guess the secret word to win!</p>
              </div>
              
              <input 
                id="guessInput" 
                placeholder="What's the secret word?" 
                className="w-full p-4 text-lg border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-green-500 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
              />
              <button 
                onClick={() => submitImposterGuess(document.getElementById("guessInput").value)} 
                className="w-full py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold text-lg shadow-lg transition-all transform hover:scale-105"
              >
                🎯 Final Guess
              </button>
            </div>
          )}

          {/* Results Phase */}
          {lobby.phase === "results" && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 space-y-4">
              <div className="text-center">
                <div className="text-4xl mb-2">🎉</div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">Round Over!</h3>
                <div className="p-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl mt-4">
                  <p className="text-yellow-800 dark:text-yellow-200 font-bold text-lg">
                    The imposter was: <span className="text-red-600 dark:text-red-400">{lobby.imposter}</span>
                  </p>
                </div>
              </div>
              
              {lobby.host === playerName && (
                <button 
                  onClick={startRound} 
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold text-lg shadow-lg transition-all transform hover:scale-105"
                >
                  🔄 Next Round
                </button>
              )}
            </div>
          )}

          {/* Leaderboard */}
          <Leaderboard gameKey="imposter" />
        </div>
      </div>
    </div>
  );
}