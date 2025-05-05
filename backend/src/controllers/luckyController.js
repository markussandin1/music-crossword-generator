// backend/src/controllers/luckyController.js

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
    const answer = q.answer ? q.answer.toUpperCase().replace(/[^A-Z]/g, '') : '';
    return answer.length >= 3 && answer.length <= 12 && /^[A-Z]+$/.test(answer);
  });

  if (validQuestions.length < 5) {
    throw new Error(`Not enough valid questions. Need at least 5 valid questions to create a crossword.`);
  }

  // Group questions by "question type" to ensure diversity
  const questionsByType = new Map();
  
  validQuestions.forEach(question => {
    // Simple heuristic for question type: first few words
    const questionWords = question.question.split(' ').slice(0, 3).join(' ').toLowerCase();
    if (!questionsByType.has(questionWords)) {
      questionsByType.set(questionWords, []);
    }
    questionsByType.get(questionWords).push(question);
  });
  
  // Select a diverse set of questions (up to 3 per type)
  const selectedQuestions = [];
  
  // Take questions from each type until we have enough
  let typesArray = Array.from(questionsByType.entries());
  while (selectedQuestions.length < 15 && typesArray.some(([_, qs]) => qs.length > 0)) {
    for (let i = 0; i < typesArray.length; i++) {
      const [type, questions] = typesArray[i];
      if (questions.length > 0) {
        // Take one question from this type
        selectedQuestions.push(questions.shift());
        
        // Break if we have enough
        if (selectedQuestions.length >= 15) break;
      }
    }
  }
  
  return selectedQuestions;
};

/**
 * Create song groups directly by matching questions to tracks
 * @param {Array} generatedQuestions - All generated questions
 * @param {Array} tracks - Tracks from the playlist
 * @returns {Array} - Song groups with associated questions
 */
const createSongGroups = (generatedQuestions, tracks) => {
  const songGroups = [];
  const trackMap = new Map();

  // Initialize groups for each track
  tracks.forEach(track => {
    trackMap.set(track.id, {
      id: track.id,
      name: track.name,
      artists: track.artists,
      album: track.album,
      previewUrl: track.previewUrl,
      popularityScore: track.popularityScore || 0,
      questions: [],
      imageUrl: track.album.images?.[0]?.url || null
    });
  });

  // Distribute questions to tracks based on the question content
  for (const question of generatedQuestions) {
    let bestTrack = null;
    let bestScore = 0;

    // Match question to track using text matching
    for (const track of tracks) {
      let score = 0;
      if (question.question.toLowerCase().includes(track.name.toLowerCase())) score += 3;
      for (const artist of track.artists) {
        if (question.question.toLowerCase().includes(artist.name.toLowerCase())) {
          score += 2;
          break;
        }
      }
      if (track.album && question.question.toLowerCase().includes(track.album.name.toLowerCase())) score += 1;

      if (score > bestScore) {
        bestScore = score;
        bestTrack = track;
      }
    }

    // Assign to the best track or general knowledge
    if (bestTrack) {
      trackMap.get(bestTrack.id).questions.push(question);
    } else {
      if (!trackMap.has('general')) {
        trackMap.set('general', {
          id: 'general',
          name: 'General Music Knowledge',
          questions: []
        });
      }
      trackMap.get('general').questions.push(question);
    }
  }

  // Convert map to array
  trackMap.forEach(group => {
    if (group.questions.length > 0) {
      songGroups.push(group);
    }
  });

  return songGroups;
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
      maxQuestions: 25, // Increased for more variety
      minAnswerLength: 3,
      maxAnswerLength: 12
    });
    
    // Step 3: Select best questions
    console.log('Selecting best questions...');
    const selectedQuestions = selectBestQuestions(questions);
    
    // Step 6: Ensure crossword entries are associated with song groups
// Create a map of clue -> entry for quick lookup
const clueEntryMap = new Map();
crosswordData.entries.forEach(entry => {
  clueEntryMap.set(entry.clue, entry);
});

// For each song group, filter its questions to only include those that made it into the crossword
songGroups.forEach(group => {
  // Find which questions from this group made it into the crossword
  group.crosswordQuestions = group.questions.filter(question => 
    clueEntryMap.has(question.question)
  );
  
  // Add crossword info to these questions
  group.crosswordQuestions.forEach(question => {
    const entry = clueEntryMap.get(question.question);
    question.crosswordEntry = entry;
  });
});

// Create enhanced crossword
const enhancedCrossword = {
  ...crosswordData,
  songGroups: songGroups,
  playlist: {
    id: playlistData.id,
    name: playlistData.name,
    description: playlistData.description,
    owner: playlistData.owner,
    images: playlistData.images,
    tracksCount: playlistData.tracksCount
  }
};
    
    console.log('Enhanced crossword song groups:', enhancedCrossword.songGroups.length);
    console.log('Lucky crossword created successfully with song grouping');
    
    // Return enhanced crossword data with song groups
    return res.status(200).json({
      success: true,
      data: enhancedCrossword
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

/**
 * Create a quiz from an existing crossword
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createQuizFromCrossword = async (req, res) => {
  try {
    const { crosswordData, questions, playlistData } = req.body;
    
    console.log('Creating quiz from existing crossword');
    
    if (!crosswordData || !questions || !playlistData) {
      return res.status(400).json({ 
        error: 'Missing required parameters: crosswordData, questions, playlistData' 
      });
    }
    
    // Use our direct song grouping method instead of songGroupingService
    console.log('Creating song groups directly...');
    const songGroups = createSongGroups(questions, playlistData.tracks);
    
    // Create enhanced crossword
    const enhancedCrossword = {
      ...crosswordData,
      songGroups: songGroups,
      playlist: {
        id: playlistData.id,
        name: playlistData.name,
        description: playlistData.description,
        owner: playlistData.owner,
        images: playlistData.images,
        tracksCount: playlistData.tracksCount
      }
    };
    
    console.log('Quiz created successfully from existing crossword');
    
    // Return enhanced crossword data with song groups
    return res.status(200).json({
      success: true,
      data: enhancedCrossword
    });
  } catch (error) {
    console.error('Error creating quiz from crossword:', error);
    return res.status(500).json({ 
      error: 'Failed to create quiz from crossword',
      message: error.message
    });
  }
};

module.exports = {
  createLuckyCrossword,
  createQuizFromCrossword
};