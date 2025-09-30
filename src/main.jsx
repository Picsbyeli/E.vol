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
import NotFound from './routes/NotFound'

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

// Removed RequireAuth for guest access; keep component import commented if needed later
// import RequireAuth from './components/RequireAuth'
import { ThemeProvider } from './components/ThemeProvider'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />, // App should render an <Outlet /> where children show
    errorElement: <NotFound />,
    children: [
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
  { path: 'riddles', element: <Riddles /> },
  { path: 'ai-riddles', element: <AIRiddles /> },
  { path: 'trivia', element: <Trivia /> },
  { path: 'chess', element: <ChessGame /> },
  { path: 'brain-puzzles', element: <BrainPuzzles /> },
  { path: 'strategy', element: <Strategy /> },
  { path: 'word-game', element: <WordGame /> },
  { path: 'emoji-guess', element: <EmojiGuess /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])

createRoot(document.getElementById('root')).render(
  <ThemeProvider>
    <Provider>
      <RouterProvider router={router} />
    </Provider>
  </ThemeProvider>
)