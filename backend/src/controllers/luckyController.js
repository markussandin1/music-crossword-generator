const spotifyService = require('../services/spotifyService');
const openaiService = require('../services/openaiService');
const crosswordService = require('../services/crosswordService');

/**
 * Select best questions for crossword building
 * @param {Array} questions - Array of question objects
 * @returns {Array} - Selected questions for crossword
 */
const selectBestQuestions = (questions) => {
  // Filter for valid questions (3-12 letters, alphabetic only)
  const validQuestions = questions.filter(q => {
    const answer = q.answer.toUpperCase().replace(/[^A-Z]/g, '');
    return answer.length >= 3 && answer.length <= 12 && /^[A-Z]+$/.test(answer);
  });

  if (validQuestions.length < 5) {
    throw new Error('Not enough valid questions to create a crossword');
  }

  // Sort and select diverse questions
  const sortedQuestions = validQuestions.sort((a, b) => {
    // Prefer answers with 4-8 characters
    const aLength = a.answer.length;
    const bLength = b.answer.length;
    const aScore = Math.abs(aLength - 6);
    const bScore = Math.abs(bLength - 6);
    return aScore - bScore;
  });

  // Select up to 15 questions with good diversity
  const selectedQuestions = [];
  const usedLetters = new Set();
  
  for (const question of sortedQuestions) {
    if (selectedQuestions.length >= 15) break;
    
    // Check if answer has unique starting letter (for better crossword layout)
    const firstLetter = question.answer[0];
    if (!usedLetters.has(firstLetter) || selectedQuestions.length < 8) {
      selectedQuestions.push(question);
      usedLetters.add(firstLetter);
    }
  }

  return selectedQuestions;
};

/**
 * Create a lucky crossword from a playlist URL
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createLuckyCrossword = async (req, res) => {
  try {
    const { playlistUrl } = req.body;
    
    console.log('Creating lucky crossword for playlist:', playlistUrl);
    
    if (!playlistUrl) {
      return res.status(400).json({ 
        error: 'Missing required parameter: playlistUrl' 
      });
    }
    
    // Step 1: Get playlist data
    console.log('Fetching playlist data...');
    const playlistData = await spotifyService.getPlaylistData(playlistUrl);
    
    // Step 2: Generate questions
    console.log('Generating questions...');
    const questions = await openaiService.generateQuestions(playlistData.tracks, {
      maxQuestions: 20,
      minAnswerLength: 3,
      maxAnswerLength: 12
    });
    
    // Step 3: Select best questions
    console.log('Selecting best questions...');
    const selectedQuestions = selectBestQuestions(questions);
    
    // Step 4: Build crossword
    console.log('Building crossword...');
    const crosswordData = crosswordService.buildCrossword(selectedQuestions);
    
    console.log('Lucky crossword created successfully');
    
    // Return crossword data
    return res.status(200).json({
      success: true,
      data: crosswordData
    });
  } catch (error) {
    console.error('Error creating lucky crossword:', error);
    
    if (error.message.includes('Not enough valid questions')) {
      return res.status(400).json({ error: error.message });
    }
    
    return res.status(500).json({ 
      error: 'Failed to create lucky crossword',
      message: error.message
    });
  }
};

module.exports = {
  createLuckyCrossword
};