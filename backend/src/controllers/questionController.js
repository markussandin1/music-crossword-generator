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
    
    // Associate each question with a track
    const enhancedQuestions = associateQuestionsWithTracks(questions, trackData);
    
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
    
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
};

/**
 * Associate questions with specific tracks
 * @param {Array} questions - Array of generated questions
 * @param {Array} tracks - Array of track objects
 * @returns {Array} - Questions with track associations
 */
const associateQuestionsWithTracks = (questions, tracks) => {
  console.log('Associating questions with tracks...');
  
  const enhancedQuestions = questions.map(question => {
    // Find the track that's most related to this question
    const matchingTrack = findRelatedTrack(question, tracks);
    
    if (matchingTrack) {
      console.log(`Question "${question.question.substring(0, 30)}..." matched to track "${matchingTrack.name}"`);
      return {
        ...question,
        trackId: matchingTrack.id,
        trackName: matchingTrack.name,
        artists: matchingTrack.artists
      };
    }
    
    console.log(`Question "${question.question.substring(0, 30)}..." has no clear track association`);
    return question;
  });
  
  const associatedCount = enhancedQuestions.filter(q => q.trackId).length;
  console.log(`Associated ${associatedCount} of ${questions.length} questions with tracks`);
  
  return enhancedQuestions;
};

/**
 * Find the track most related to a question
 * @param {Object} question - Question object
 * @param {Array} tracks - Array of track objects
 * @returns {Object|null} - Matching track or null if no match
 */
const findRelatedTrack = (question, tracks) => {
  const questionText = question.question.toLowerCase();
  
  // First, look for direct mention of track name
  for (const track of tracks) {
    if (questionText.includes(track.name.toLowerCase())) {
      return track;
    }
  }
  
  // Next, look for artist mentions
  for (const track of tracks) {
    for (const artist of track.artists) {
      if (questionText.includes(artist.name.toLowerCase())) {
        return track;
      }
    }
  }
  
  // Finally, look for album mentions
  for (const track of tracks) {
    if (track.album && questionText.includes(track.album.name.toLowerCase())) {
      return track;
    }
  }
  
  // If no match found, return null
  return null;
};

module.exports = {
  generateQuestions
};