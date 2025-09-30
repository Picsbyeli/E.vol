import React, { useEffect, useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from './lib/firebase'

function App() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u))
    return () => unsub()
  }, [])

  const handleLogout = () => {
    signOut(auth).catch(console.error)
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-purple-50 to-white">
      {/* Top Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 bg-white shadow">
        <Link to="/E.vol/" className="text-xl font-bold text-purple-700">
          🎮 E.Vol
        </Link>
        <div className="flex gap-4 text-sm">
          <Link to="/riddles" className="hover:text-purple-600">Riddles</Link>
          <Link to="/emoji-guess" className="hover:text-purple-600">Emoji</Link>
          <Link to="/trivia" className="hover:text-purple-600">Trivia</Link>
          <Link to="/chess" className="hover:text-purple-600">Chess</Link>
          <Link to="/strategy" className="hover:text-purple-600">Connect4</Link>
        </div>
        <div>
          {user ? (
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600"
            >
              Sign Out
            </button>
          ) : (
            <span className="text-gray-500 text-sm">Guest Mode</span>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 container mx-auto p-6 w-full">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-gray-500 text-xs">
        © {new Date().getFullYear()} E.Vol — Play, Learn, Compete
      </footer>
    </div>
  )
}

export default App