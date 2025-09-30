import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './App'

import Login from './routes/Login'
import Register from './routes/Register'
import Riddles from './routes/Riddles'
import AIRiddles from './routes/AIRiddles'
import Trivia from './routes/Trivia'
import ChessGame from './routes/ChessGame'
import BrainPuzzles from './routes/BrainPuzzles'
import Strategy from './routes/Strategy'
import WordGame from './routes/WordGame'
import EmojiGuess from './routes/EmojiGuess'

// Minimal inline AuthProvider to avoid extra files:
import { createContext, useContext, useEffect, useState } from 'react'
import { auth, googleProvider } from './lib/firebase'
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, signOut, updateProfile } from 'firebase/auth'

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

function Provider({ children }) {
  const [user, setUser] = useState(undefined)
  useEffect(() => onAuthStateChanged(auth, setUser), [])
  const value = {
    user,
    loading: user === undefined,
    signInEmail: (email, pass) => signInWithEmailAndPassword(auth, email, pass),
    registerEmail: async (email, pass, displayName) => {
      const cred = await createUserWithEmailAndPassword(auth, email, pass)
      if (displayName) await updateProfile(cred.user, { displayName })
      return cred
    },
    signInGoogle: () => signInWithPopup(auth, googleProvider),
    signOut: () => signOut(auth),
  }
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

import RequireAuth from './components/RequireAuth'
import { ThemeProvider } from './components/ThemeProvider'

const router = createBrowserRouter([
  { path: '/', element: <App /> },
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '/riddles', element: <RequireAuth><Riddles /></RequireAuth> },
  { path: '/ai-riddles', element: <RequireAuth><AIRiddles /></RequireAuth> },
  { path: '/trivia', element: <RequireAuth><Trivia /></RequireAuth> },
  { path: '/chess', element: <RequireAuth><ChessGame /></RequireAuth> },
  { path: '/brain-puzzles', element: <RequireAuth><BrainPuzzles /></RequireAuth> },
  { path: '/strategy', element: <RequireAuth><Strategy /></RequireAuth> },
  { path: '/word-game', element: <RequireAuth><WordGame /></RequireAuth> },
  { path: '/emoji-guess', element: <RequireAuth><EmojiGuess /></RequireAuth> },
])

createRoot(document.getElementById('root')).render(
  <ThemeProvider>
    <Provider>
      <RouterProvider router={router} />
    </Provider>
  </ThemeProvider>
)