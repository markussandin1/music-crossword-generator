const openaiService = require('../services/openaiService');

/**
 * Generate questions using OpenAI
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const generateQuestions = async (req, res) => {
  try {
    const { trackData, options } = req.body;
    
    console.log('Received request to generate questions');
    
    if (!trackData || !Array.isArray(trackData) || trackData.length === 0) {
      return res.status(400).json({ 
        error: 'Missing or invalid required parameter: trackData' 
      });
    }
    
    // Generate questions using OpenAI
    console.log(`Generating questions for ${trackData.length} tracks...`);
    const questions = await openaiService.generateQuestions(trackData, options);
    
    if (!questions || questions.length === 0) {
      console.error('No questions were generated');
      return res.status(500).json({ error: 'Failed to generate questions' });
    }
    
    // Enhance questions with additional track metadata
    const enhancedQuestions = enhanceQuestionsWithTrackData(questions, trackData);
    
    console.log(`Generated ${enhancedQuestions.length} questions successfully`);
    
    // Return generated questions
    return res.status(200).json({
      success: true,
      data: {
        questions: enhancedQuestions,
        count: enhancedQuestions.length
      }
    });
  } catch (error) {
    console.error('Error in generateQuestions controller:', error);
    
    // Handle OpenAI API errors
    if (error.status === 429) {
      return res.status(429).json({ error: 'Too many requests to OpenAI API' });
    }
    
    if (error.message.includes('Invalid response format')) {
      return res.status(500).json({ error: 'Failed to generate valid questions' });
    }
    
    if (error.message.includes('valid track IDs')) {
      return res.status(500).json({ 
        error: 'Track association error',
        message: error.message 
      });
    }
    
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
};

/**
 * Enhance questions with additional track metadata
 * @param {Array} questions - Array of generated questions with trackId
 * @param {Array} tracks - Array of track objects
 * @returns {Array} - Questions with enhanced track data
 */
const enhanceQuestionsWithTrackData = (questions, tracks) => {
  console.log('Enhancing questions with track metadata...');
  
  // Create a map of track IDs to track objects for quick lookup
  const trackMap = new Map();
  tracks.forEach(track => {
    trackMap.set(track.id, track);
  });
  
  const enhancedQuestions = questions.map(question => {
    // Verify trackId already exists from OpenAI service
    if (!question.trackId) {
      console.error(`Question missing trackId: ${question.question}`);
      throw new Error(`Question missing trackId: "${question.question.substring(0, 50)}..."`);
    }
    
    // Get track by ID
    const track = trackMap.get(question.trackId);
    if (!track) {
      console.error(`Invalid trackId ${question.trackId} for question: ${question.question}`);
      throw new Error(`Invalid trackId ${question.trackId} for question: "${question.question.substring(0, 50)}..."`);
    }
    
    // Enhance question with additional track metadata that might be useful
    const enhancedQuestion = {
      ...question,
      trackName: track.name,
      artists: track.artists,
      albumName: track.album?.name,
      releaseYear: track.album?.releaseDate?.split('-')[0],
      previewUrl: track.previewUrl
    };
    
    console.log(`Enhanced question for track "${track.name}": ${question.question.substring(0, 30)}...`);
    return enhancedQuestion;
  });
  
  console.log(`Enhanced ${enhancedQuestions.length} questions with track metadata`);
  return enhancedQuestions;
};

module.exports = {
  generateQuestions
};