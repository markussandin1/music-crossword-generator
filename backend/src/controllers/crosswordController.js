const crosswordService = require('../services/crosswordService');

/**
 * Build a crossword grid from selected questions
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const buildCrossword = (req, res) => {
  try {
    const { questions } = req.body;
    
    console.log('Received request to build crossword');
    
    if (!questions || !Array.isArray(questions) || questions.length < 3) {
      return res.status(400).json({ 
        error: 'At least 3 questions are required to build a crossword' 
      });
    }
    
    // Validate that we have enough questions with valid answers
    const validQuestions = questions.filter(q => {
      const answer = q.answer ? q.answer.toUpperCase().replace(/[^A-Z]/g, '') : '';
      return answer.length >= 3 && /^[A-Z]+$/.test(answer);
    });
    
    if (validQuestions.length < 3) {
      return res.status(400).json({
        error: 'At least 3 valid questions are required. Valid answers must have at least 3 letters and contain only letters A-Z.'
      });
    }
    
    // Build crossword grid
    console.log(`Building crossword with ${questions.length} questions`);
    const crosswordData = crosswordService.buildCrossword(questions);
    console.log('Crossword built successfully');
    
    // Return crossword data
    return res.status(200).json({
      success: true,
      data: crosswordData
    });
  } catch (error) {
    console.error('Error in buildCrossword controller:', error);
    return res.status(500).json({ 
      error: 'Failed to build crossword',
      message: error.message 
    });
  }
};

module.exports = {
  buildCrossword
};