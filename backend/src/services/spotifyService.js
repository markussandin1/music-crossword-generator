const SpotifyWebApi = require('spotify-web-api-node');
require('dotenv').config();

// Initialize Spotify API client
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

/**
 * Set up Spotify client credentials
 * @returns {Promise<void>}
 */
const setupClientCredentials = async () => {
  try {
    const data = await spotifyApi.clientCredentialsGrant();
    console.log('Spotify access token retrieved');
    spotifyApi.setAccessToken(data.body.access_token);
    
    // Set token refresh timeout (expires in 1 hour)
    setTimeout(() => {
      setupClientCredentials();
    }, (data.body.expires_in - 60) * 1000); // Refresh 1 minute before expiration
  } catch (error) {
    console.error('Error retrieving Spotify access token:', error);
    throw error;
  }
};

/**
 * Extract playlist ID from Spotify URL
 * @param {string} url - Spotify playlist URL
 * @returns {string|null} - Extracted playlist ID or null if invalid
 */
const extractPlaylistId = (url) => {
  // Handle various Spotify URL formats
  const patterns = [
    /spotify:playlist:([a-zA-Z0-9]+)/,           // Spotify URI
    /open\.spotify\.com\/playlist\/([a-zA-Z0-9]+)/, // Web URL
    /^([a-zA-Z0-9]+)$/                            // Raw ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
};

/**
 * Get playlist data from Spotify
 * @param {string} playlistUrl - Spotify playlist URL
 * @returns {Promise<Object>} - Playlist data with tracks
 */
const getPlaylistData = async (playlistUrl) => {
  try {
    // Ensure we have an access token
    if (!spotifyApi.getAccessToken()) {
      await setupClientCredentials();
    }

    // Extract the playlist ID from the URL
    const playlistId = extractPlaylistId(playlistUrl);
    if (!playlistId) {
      throw new Error('Invalid Spotify playlist URL');
    }

    // Get playlist metadata
    const playlistData = await spotifyApi.getPlaylist(playlistId);
    
    // We need to handle pagination for playlists with more than 100 tracks
    let tracks = playlistData.body.tracks.items;
    let nextUrl = playlistData.body.tracks.next;
    
    while (nextUrl) {
      const moreTracksData = await spotifyApi.getPlaylistTracks(playlistId, {
        offset: tracks.length,
        limit: 100
      });
      tracks = [...tracks, ...moreTracksData.body.items];
      nextUrl = moreTracksData.body.next;
    }
    
    // Map track data to a simpler format
    const simplifiedTracks = tracks.map(item => {
      if (!item.track) return null; // Skip null tracks
      
      return {
        id: item.track.id,
        name: item.track.name,
        artists: item.track.artists.map(artist => ({
          id: artist.id,
          name: artist.name
        })),
        album: {
          id: item.track.album.id,
          name: item.track.album.name,
          releaseDate: item.track.album.release_date,
          images: item.track.album.images
        },
        previewUrl: item.track.preview_url,
        popularityScore: item.track.popularity
      };
    }).filter(Boolean); // Remove null entries
    
    return {
      id: playlistData.body.id,
      name: playlistData.body.name,
      description: playlistData.body.description,
      owner: {
        id: playlistData.body.owner.id,
        displayName: playlistData.body.owner.display_name
      },
      images: playlistData.body.images,
      tracks: simplifiedTracks,
      tracksCount: simplifiedTracks.length
    };
  } catch (error) {
    console.error('Error fetching playlist data:', error);
    throw error;
  }
};

// Initialize the token on startup
setupClientCredentials().catch(console.error);

module.exports = {
  spotifyApi,
  setupClientCredentials,
  getPlaylistData,
  extractPlaylistId
};