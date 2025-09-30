// Music API utilities for Spotify and YouTube integration

let spotifyToken = null
let tokenExpiry = null

// Get Spotify access token
async function getSpotifyToken() {
  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID
  const clientSecret = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    console.warn('Spotify credentials not configured')
    return null
  }

  // Return cached token if still valid
  if (spotifyToken && tokenExpiry && Date.now() < tokenExpiry) {
    return spotifyToken
  }

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`
      },
      body: 'grant_type=client_credentials'
    })

    if (!response.ok) {
      throw new Error(`Spotify auth failed: ${response.status}`)
    }

    const data = await response.json()
    spotifyToken = data.access_token
    tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000 // Refresh 1 min early
    
    return spotifyToken
  } catch (error) {
    console.error('Spotify token error:', error)
    return null
  }
}

// Search Spotify tracks
export async function searchSpotify(query, limit = 10) {
  const token = await getSpotifyToken()
  if (!token) return []

  try {
    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Spotify search failed: ${response.status}`)
    }

    const data = await response.json()
    
    return data.tracks?.items?.map(track => ({
      id: track.id,
      title: `${track.artists[0]?.name} - ${track.name}`,
      type: 'spotify',
      url: track.external_urls.spotify,
      preview: track.preview_url,
      image: track.album.images[0]?.url
    })) || []
  } catch (error) {
    console.error('Spotify search error:', error)
    return []
  }
}

// Search YouTube videos
export async function searchYouTube(query, limit = 10) {
  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY
  
  if (!apiKey || apiKey === 'YOUR_YOUTUBE_API_KEY') {
    console.warn('YouTube API key not configured')
    return []
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=${limit}&q=${encodeURIComponent(query)}&type=video&key=${apiKey}`
    )

    if (!response.ok) {
      throw new Error(`YouTube search failed: ${response.status}`)
    }

    const data = await response.json()
    
    return data.items?.map(item => ({
      id: item.id.videoId,
      title: item.snippet.title,
      type: 'youtube',
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      thumbnail: item.snippet.thumbnails.medium?.url,
      channel: item.snippet.channelTitle
    })) || []
  } catch (error) {
    console.error('YouTube search error:', error)
    return []
  }
}

// Combined music search
export async function searchMusic(query, limit = 5) {
  try {
    const [spotifyResults, youtubeResults] = await Promise.all([
      searchSpotify(query, limit),
      searchYouTube(query, limit)
    ])

    // Interleave results
    const combined = []
    const maxLength = Math.max(spotifyResults.length, youtubeResults.length)
    
    for (let i = 0; i < maxLength; i++) {
      if (spotifyResults[i]) combined.push(spotifyResults[i])
      if (youtubeResults[i]) combined.push(youtubeResults[i])
    }
    
    return combined.slice(0, limit * 2)
  } catch (error) {
    console.error('Music search error:', error)
    return []
  }
}