const CrosswordService = require('../services/crosswordService');

/**
 * Build a crossword grid from selected questions
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const buildCrossword = (req, res) => {
  try {
    const { questions } = req.body;
    
    console.log('Received request to build crossword');
    
    if (!questions || !Array.isArray(questions) || questions.length < 5) {
      return res.status(400).json({ 
        error: 'At least 5 questions are required to build a crossword' 
      });
    }
    
    // Create an instance of the CrosswordService
    const crosswordService = new CrosswordService();
    
    // Build crossword grid
    console.log(`Building crossword with ${questions.length} questions`);
    const crosswordData = crosswordService.buildCrossword(questions);
    console.log('Crossword built successfully');
    
    // Return crossword data directly instead of nesting it
    return res.status(200).json(crosswordData);
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