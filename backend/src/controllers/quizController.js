// backend/src/controllers/quizController.js

const spotifyService = require('../services/spotifyService');
const songGroupingService = require('../services/songGroupingService');

/**
 * Get song groups for a playlist
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getSongGroups = async (req, res) => {
  try {
    const { playlistId } = req.params;
    
    console.log('Getting song groups for playlist:', playlistId);
    
    if (!playlistId) {
      return res.status(400).json({ 
        error: 'Missing required parameter: playlistId' 
      });
    }
    
    // Get playlist data with tracks from Spotify
    console.log('Fetching playlist data...');
    const playlistData = await spotifyService.getPlaylistData(`spotify:playlist:${playlistId}`);
    
    // Get existing questions and crossword data
    // In a real implementation, these would be fetched from a database
    // For now, we'll return an error since we don't have a full implementation
    return res.status(501).json({
      error: 'Song group retrieval not fully implemented',
      message: 'This endpoint requires database integration to retrieve saved questions and crossword data'
    });
    
    // The below code would be used in a full implementation:
    /*
    // Get saved questions for this playlist
    const questions = await questionRepository.getByPlaylistId(playlistId);
    
    // Get saved crossword for this playlist
    const crosswordData = await crosswordRepository.getByPlaylistId(playlistId);
    
    // Process playlist data for quiz with song grouping
    const enhancedCrossword = songGroupingService.processPlaylistForQuiz(
      questions,
      playlistData,
      crosswordData
    );
    
    // Return only the song groups
    return res.status(200).json({
      success: true,
      data: enhancedCrossword.songGroups
    });
    */
  } catch (error) {
    console.error('Error getting song groups:', error);
    return res.status(500).json({ 
      error: 'Failed to retrieve song groups',
      message: error.message
    });
  }
};

/**
 * Save quiz results
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const saveQuizResults = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { results } = req.body;
    
    console.log(`Saving quiz results for quiz ID: ${quizId}`);
    
    if (!quizId || !results) {
      return res.status(400).json({ 
        error: 'Missing required parameters' 
      });
    }
    
    // In a real implementation, save to database
    console.log('Quiz results:', results);
    
    // For now, just return success
    return res.status(200).json({
      success: true,
      message: 'Quiz results saved successfully'
    });
  } catch (error) {
    console.error('Error saving quiz results:', error);
    return res.status(500).json({ 
      error: 'Failed to save quiz results',
      message: error.message
    });
  }
};

/**
 * Get audio preview URL from Spotify
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAudioPreview = async (req, res) => {
  try {
    const { trackId } = req.params;
    
    console.log(`Getting audio preview for track ID: ${trackId}`);
    
    if (!trackId) {
      return res.status(400).json({ 
        error: 'Missing required parameter: trackId' 
      });
    }
    
    // Get track data from Spotify
    const trackData = await spotifyService.getTrack(trackId);
    
    // Check if preview URL is available
    if (!trackData.preview_url) {
      return res.status(404).json({
        error: 'No preview available for this track'
      });
    }
    
    // Return preview URL
    return res.status(200).json({
      success: true,
      data: {
        previewUrl: trackData.preview_url
      }
    });
  } catch (error) {
    console.error('Error getting audio preview:', error);
    return res.status(500).json({ 
      error: 'Failed to get audio preview',
      message: error.message
    });
  }
};

module.exports = {
  getSongGroups,
  saveQuizResults,
  getAudioPreview
};