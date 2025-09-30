import { Link } from 'react-router-dom'
import { useAuth } from '../main'
import ThemeToggle from './ThemeToggle'

export default function Nav(){
  const { user, signOut } = useAuth()
  return (
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-sm border-b shadow-sm">
      <nav className="mx-auto max-w-6xl p-3 flex items-center gap-3">
        <Link to="/" className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          🧠 E.Vol
        </Link>
        <div className="ml-auto flex items-center gap-3 text-sm flex-wrap">
          <Link to="/riddles" className="hover:text-blue-600 transition-colors px-2 py-1 rounded hover:bg-blue-50">Riddles</Link>
          <Link to="/word-game" className="hover:text-green-600 transition-colors px-2 py-1 rounded hover:bg-green-50">Words</Link>
          <Link to="/emoji-guess" className="hover:text-pink-600 transition-colors px-2 py-1 rounded hover:bg-pink-50">Emoji</Link>
          <Link to="/trivia" className="hover:text-purple-600 transition-colors px-2 py-1 rounded hover:bg-purple-50">Trivia</Link>
          <Link to="/chess" className="hover:text-gray-700 transition-colors px-2 py-1 rounded hover:bg-gray-50">Chess</Link>
          <Link to="/brain-puzzles" className="hover:text-orange-600 transition-colors px-2 py-1 rounded hover:bg-orange-50">2048</Link>
          <Link to="/strategy" className="hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-red-50">Connect4</Link>
          <ThemeToggle />
          {user ? (
            <>
              <span className="px-3 py-1 border rounded-full bg-gradient-to-r from-blue-50 to-purple-50 text-sm font-medium">
                {user.displayName || user.email}
              </span>
              <button 
                onClick={signOut} 
                className="hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-red-50"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link 
              to="/login" 
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200"
            >
              Sign in
            </Link>
          )}
        </div>
      </nav>
    </header>
  )
}