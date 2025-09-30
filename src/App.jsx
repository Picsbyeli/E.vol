import { Link, Outlet } from 'react-router-dom'
import Nav from './components/Nav'
import MusicBar from './components/MusicBar'
import AIStatusDashboard from './components/AIStatusDashboard'
import Leaderboard from './components/Leaderboard'
import StatsHeader from './components/StatsHeader'

export default function App(){
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Nav />
      <main className="mx-auto max-w-6xl p-4 grid gap-6">
        <section className="text-center space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            🧠 E.Vol
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Challenge your mind with riddles, brain puzzles, chess, strategy games, and trivia – 
            all with music, authentication, and competitive leaderboards.
          </p>
        </section>

        <StatsHeader />

        <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <GameCard 
            title="🧩 Riddles" 
            to="/riddles" 
            desc="Solve clever riddles and build your streak!" 
            difficulty="Easy-Hard"
            color="from-blue-500 to-blue-600"
          />
          <GameCard 
            title="🤖 AI Riddles" 
            to="/ai-riddles" 
            desc="Unlimited AI-generated riddles!" 
            difficulty="Dynamic"
            color="from-purple-500 to-purple-600"
          />
          <GameCard 
            title="🔤 Word Game" 
            to="/word-game" 
            desc="Guess the hidden word letter by letter" 
            difficulty="Easy-Hard"
            color="from-green-500 to-green-600"
          />
          <GameCard 
            title="😄 Emoji Guess" 
            to="/emoji-guess" 
            desc="Decode emoji puzzles and phrases" 
            difficulty="Easy-Hard"
            color="from-pink-500 to-pink-600"
          />
          <GameCard 
            title="🎓 Trivia" 
            to="/trivia" 
            desc="5th-grader style multiple choice questions" 
            difficulty="Medium"
            color="from-purple-500 to-purple-600"
          />
          <GameCard 
            title="♟️ Chess" 
            to="/chess" 
            desc="Play on a classic interactive chessboard" 
            difficulty="Strategic"
            color="from-gray-700 to-gray-800"
          />
          <GameCard 
            title="🧠 Brain Puzzles" 
            to="/brain-puzzles" 
            desc="2048 mini – merge tiles to victory" 
            difficulty="Medium"
            color="from-orange-500 to-orange-600"
          />
          <GameCard 
            title="🔴 Strategy" 
            to="/strategy" 
            desc="Connect Four tactical showdown" 
            difficulty="Strategic"
            color="from-red-500 to-red-600"
          />
        </section>

        <section className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
            <Leaderboard />
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
            <h2 className="text-2xl font-semibold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              About E.Vol
            </h2>
            <div className="space-y-3 text-gray-700">
              <p>🎯 <strong>Competitive Gaming:</strong> Sign in to track scores and compete on leaderboards</p>
              <p>🎵 <strong>Music Integration:</strong> Listen to YouTube, Spotify, Apple Music, or upload your own files</p>
              <p>🧠 <strong>Brain Training:</strong> Multiple game types to challenge different cognitive skills</p>
              <p>📱 <strong>Mobile Friendly:</strong> Play anywhere on any device</p>
              <p>🔒 <strong>Secure:</strong> Google OAuth and email authentication supported</p>
            </div>
          </div>
        </section>
        {/* Nested route outlet: child pages render here when navigated (e.g., /riddles) */}
        <div className="bg-white/50 rounded-xl p-2">
          <Outlet />
        </div>
      </main>
      <MusicBar />
      
      {/* AI Status Dashboard */}
      <AIStatusDashboard />
    </div>
  )
}

function GameCard({ title, desc, to, difficulty, color }){
  return (
    <Link 
      to={to} 
      className="group block bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-800 group-hover:text-gray-900">
            {title}
          </h3>
          <span className={`px-3 py-1 rounded-full text-xs font-medium text-white bg-gradient-to-r ${color}`}>
            {difficulty}
          </span>
        </div>
        <p className="text-gray-600 leading-relaxed">{desc}</p>
        <div className="flex items-center text-blue-600 font-medium group-hover:text-blue-700">
          <span>Play Now</span>
          <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  )
}