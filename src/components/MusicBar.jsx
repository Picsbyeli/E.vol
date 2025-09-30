import { useEffect, useMemo, useRef, useState } from 'react'

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

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-2 flex flex-col sm:flex-row gap-2 items-center">
      <input className="flex-1 border rounded p-2 w-full" placeholder="Paste YouTube / Spotify / Apple Music link" value={url} onChange={(e)=> setUrl(e.target.value)} />
      <label className="border rounded px-3 py-2 cursor-pointer">
        Upload MP3/WAV
        <input type="file" accept="audio/*" className="hidden" onChange={(e)=> setFile(e.target.files?.[0] || null)} />
      </label>

      <div className="w-full">
        {kind === 'youtube' && ytEmbed(url) && (
          <iframe className="w-full h-28 sm:h-20" src={ytEmbed(url)} title="YouTube" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
        )}
        {kind === 'spotify' && spotifyEmbed(url) && (
          <iframe className="w-full h-28 sm:h-80" src={spotifyEmbed(url)} allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
        )}
        {kind === 'apple' && (
          <iframe className="w-full h-28 sm:h-20" allow="autoplay *; encrypted-media *;" sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-top-navigation-by-user-activation" src={appleEmbed(url)} />
        )}
        {kind === 'local' && objectUrl && (
          <audio ref={audioRef} src={objectUrl} controls className="w-full" />
        )}
      </div>
    </div>
  )
}