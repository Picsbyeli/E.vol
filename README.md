# E.Vol

🧠 **Enhanced Multi-Game Platform** - Riddles, Word Games, Emoji Puzzles, Chess, Strategy, Trivia with modern UI, music integration, competitive scoring, and dark mode support.

## ✨ Features

### 🎮 **7 Game Types**
- **🧩 Riddles** - Logic puzzles with difficulty levels and categories
- **🔤 Word Game** - Hangman-style letter guessing
- **😄 Emoji Guess** - Decode emoji puzzles and phrases  
- **🎓 Trivia** - "Are You Smarter Than a 5th Grader?" questions
- **♟️ Chess** - Interactive chessboard with drag-and-drop
- **🧠 2048** - Brain puzzle with keyboard controls
- **🔴 Connect Four** - Strategic tile-dropping game

### 🎯 **Game Mechanics**
- **Difficulty-based scoring** (Easy: 10-15pts, Medium: 20-25pts, Hard: 30-40pts)
- **Hint system** with point penalties (-5pts per hint)
- **Streak tracking** and session scoring
- **Category filtering** (Logic, Word, Technology, etc.)
- **Limited attempts** and progressive hints

### 🎨 **Modern UI/UX**
- **Gradient backgrounds** and smooth animations
- **Dark mode toggle** with system preference detection
- **Mobile-first responsive design**
- **StatsHeader** showing Total Score, Games Played, Win Rate
- **Color-coded difficulty badges** and category tags
- **Hover effects** and interactive feedback

### 🏆 **Competitive Features**
- **Firebase authentication** (Google OAuth + Email)
- **Real-time leaderboards** (global + game-specific)
- **Score persistence** across sessions
- **User statistics** and performance tracking

### 🎵 **Music Integration**
- **YouTube, Spotify, Apple Music** link support
- **Local file upload** (MP3/WAV)
- **Background music bar** with embedded players

## 🚀 Quick Start

1. **Setup Firebase:**
   ```bash
   cp .env.example .env
   # Fill in your Firebase project values
   ```

2. **Install & Run:**
   ```bash
   npm install
   npm run dev
   ```

3. **Visit:** http://localhost:5173

## 🔧 Dependencies

```json
{
  "dependencies": {
    "chess.js": "^1.0.0",
    "classnames": "^2.5.1", 
    "firebase": "^10.13.1",
    "react": "^18.3.1",
    "react-chessboard": "^4.5.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.28.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.47", 
    "tailwindcss": "^3.4.13",
    "vite": "^5.4.6"
  }
}
```

## 🚀 Deploy to GitHub Pages

1. Push to GitHub repository
2. Enable Pages in repository settings  
3. GitHub Actions workflow automatically builds and deploys

## 🏗️ Project Structure

```
E.Vol/
├── 📁 .github/workflows/     # GitHub Actions deployment
├── 📁 public/                # Static assets (favicon)
├── 📁 src/
│   ├── 📁 components/        # Reusable UI components
│   │   ├── Nav.jsx           # Navigation with theme toggle
│   │   ├── StatsHeader.jsx   # User statistics display
│   │   ├── MusicBar.jsx      # Music integration
│   │   ├── Leaderboard.jsx   # Score rankings
│   │   ├── ThemeProvider.jsx # Dark mode context
│   │   └── ThemeToggle.jsx   # Theme switching button
│   ├── 📁 routes/            # Game pages
│   │   ├── Riddles.jsx       # Enhanced riddle game
│   │   ├── WordGame.jsx      # Letter guessing game
│   │   ├── EmojiGuess.jsx    # Emoji puzzle game
│   │   ├── Trivia.jsx        # Multiple choice quiz
│   │   ├── ChessGame.jsx     # Interactive chess
│   │   ├── BrainPuzzles.jsx  # 2048 puzzle game
│   │   └── Strategy.jsx      # Connect Four
│   ├── 📁 lib/               # Utilities
│   │   ├── firebase.js       # Firebase configuration
│   │   └── scores.js         # Score management
│   ├── 📁 data/              # Game content
│   │   ├── riddles.json      # Riddle questions with metadata
│   │   ├── words.json        # Word game vocabulary
│   │   ├── emojis.json       # Emoji puzzle data
│   │   └── trivia_5th.json   # Trivia questions
│   ├── App.jsx               # Main application layout
│   ├── main.jsx              # App entry point with routing
│   └── index.css             # Tailwind CSS imports
├── package.json              # Dependencies and scripts
├── tailwind.config.js        # Tailwind with dark mode
├── vite.config.js            # Vite build configuration
└── README.md                 # This file
```

## 🎯 Scoring System

| Difficulty | Base Points | Penalties |
|------------|-------------|-----------|
| Easy       | 10-15 pts   | Hint: -5pts |
| Medium     | 20-25 pts   | Wrong: -2pts |
| Hard       | 30-40 pts   | Min: 1pt |

## 🌙 Dark Mode

Automatic system preference detection with manual toggle. Theme persists across sessions via localStorage.

## 📱 Mobile Support

Fully responsive design with touch-friendly controls and mobile-optimized layouts.

---

**🎮 Start playing, compete on leaderboards, and enjoy the music! 🎵**