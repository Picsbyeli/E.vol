import { useEffect, useMemo, useRef, useState } from 'react'
import { searchMusic } from '../lib/music'

const isYouTube = (u)=> /youtube\.com\/watch\?v=|youtu\.be\//.test(u)
const isSpotify = (u)=> /open\.spotify\.com\/(track|playlist|album)\//.test(u)
const isApple = (u)=> /music\.apple\.com\//.test(u)

function ytEmbed(url){
  const m = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_\-]+)/)
  return m ? `https://www.youtube.com/embed/${m[1]}` : null
}
function spotifyEmbed(url){
  const m = url.match(/open\.spotify\.com\/(track|playlist|album)\/([A-Za-z0-9]+)/)
  return m ? `https://open.spotify.com/embed/${m[1]}/${m[2]}` : null
}
function appleEmbed(url){
  return url.includes('?') ? url : `${url}?app=music`
}

export default function MusicBar(){
  const [url, setUrl] = useState('')
  const [file, setFile] = useState(null)
  const [objectUrl, setObjectUrl] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const audioRef = useRef(null)

  useEffect(()=>{
    if (!file) return
    const obj = URL.createObjectURL(file)
    setObjectUrl(obj)
    return ()=> URL.revokeObjectURL(obj)
  }, [file])

  const kind = useMemo(()=>{
    if (file) return 'local'
    if (isYouTube(url)) return 'youtube'
    if (isSpotify(url)) return 'spotify'
    if (isApple(url)) return 'apple'
    return null
  }, [url, file])

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    setIsSearching(true)
    try {
      const results = await searchMusic(searchQuery.trim(), 5)
      setSearchResults(results)
      setShowSearch(true)
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const selectResult = (result) => {
    setUrl(result.url)
    setShowSearch(false)
    setSearchQuery('')
    setSearchResults([])
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 shadow-lg">
      {/* Search Results */}
      {showSearch && searchResults.length > 0 && (
        <div className="border-b border-gray-200 dark:border-slate-700 max-h-40 overflow-y-auto bg-gray-50 dark:bg-slate-800">
          <div className="flex items-center justify-between p-2 border-b">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Search Results</span>
            <button 
              onClick={() => setShowSearch(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>
          <ul className="divide-y divide-gray-200 dark:divide-slate-600">
            {searchResults.map((result, idx) => (
              <li 
                key={`${result.type}-${result.id}-${idx}`}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                onClick={() => selectResult(result)}
              >
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    result.type === 'spotify' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                    result.type === 'youtube' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                    'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300'
                  }`}>
                    {result.type}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {result.title}
                    </p>
                    {result.channel && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {result.channel}
                      </p>
                    )}
                  </div>
                  {result.image && (
                    <img src={result.image} alt="" className="w-8 h-8 rounded object-cover" />
                  )}
                  {result.thumbnail && (
                    <img src={result.thumbnail} alt="" className="w-8 h-8 rounded object-cover" />
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Main Music Bar */}
      <div className="p-3 space-y-3">
        {/* URL Input and Search */}
        <div className="flex flex-col sm:flex-row gap-2">
          <input 
            className="flex-1 border border-gray-300 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            placeholder="Paste YouTube/Spotify/Apple Music link" 
            value={url} 
            onChange={(e)=> setUrl(e.target.value)} 
          />
          
          <div className="flex gap-2">
            <div className="flex">
              <input
                className="border border-gray-300 dark:border-slate-600 rounded-l-lg p-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Search music..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <button
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-r-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
              >
                {isSearching ? '...' : '🔍'}
              </button>
            </div>
            
            <label className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-lg cursor-pointer transition-colors">
              📁 Upload
              <input type="file" accept="audio/*" className="hidden" onChange={(e)=> setFile(e.target.files?.[0] || null)} />
            </label>
          </div>
        </div>

        {/* Player */}
        <div className="w-full">
          {kind === 'youtube' && ytEmbed(url) && (
            <iframe 
              className="w-full h-20 rounded-lg" 
              src={ytEmbed(url)} 
              title="YouTube" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen 
            />
          )}
          {kind === 'spotify' && spotifyEmbed(url) && (
            <iframe 
              className="w-full h-20 rounded-lg" 
              src={spotifyEmbed(url)} 
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
              loading="lazy"
            />
          )}
          {kind === 'apple' && (
            <iframe 
              className="w-full h-20 rounded-lg" 
              allow="autoplay *; encrypted-media *;" 
              sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-top-navigation-by-user-activation" 
              src={appleEmbed(url)} 
            />
          )}
          {kind === 'local' && objectUrl && (
            <audio ref={audioRef} src={objectUrl} controls className="w-full" />
          )}
        </div>
      </div>
    </div>
  )
}