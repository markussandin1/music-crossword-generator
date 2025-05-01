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
    
    console.log(`Generated ${questions.length} questions successfully`);
    
    // Return generated questions
    return res.status(200).json({
      success: true,
      data: {
        questions,
        count: questions.length
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

module.exports = {
  generateQuestions
};