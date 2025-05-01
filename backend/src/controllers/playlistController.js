const spotifyService = require('../services/spotifyService');

/**
 * Get playlist data from Spotify
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getPlaylistData = async (req, res) => {
  try {
    const { playlistUrl } = req.body;
    
    console.log('Received request for playlist:', playlistUrl);
    
    if (!playlistUrl) {
      return res.status(400).json({ 
        error: 'Missing required parameter: playlistUrl' 
      });
    }
    
    // Extract playlist data from Spotify
    console.log('Calling Spotify service...');
    const playlistData = await spotifyService.getPlaylistData(playlistUrl);
    console.log('Spotify service returned data successfully');

    // Return playlist data
    return res.status(200).json({
      success: true,
      data: playlistData
    });
  } catch (error) {
    console.error('Error in getPlaylistData controller:', error);
    
    // Handle common errors
    if (error.message === 'Invalid Spotify playlist URL') {
      return res.status(400).json({ error: error.message });
    }
    
    if (error.statusCode === 404) {
      return res.status(404).json({ error: 'Spotify playlist not found' });
    }
    
    if (error.statusCode === 401 || error.statusCode === 403) {
      return res.status(error.statusCode).json({ 
        error: 'Authentication error with Spotify API' 
      });
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getPlaylistData
};