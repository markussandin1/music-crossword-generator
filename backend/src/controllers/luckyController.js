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

  generatedQuestions.forEach(question => {
    if (question.trackId && trackMap.has(question.trackId)) {
      trackMap.get(question.trackId).questions.push(question);
    } else {
      console.warn(`Question "${question.question}" has no valid trackId`);
    }
  });

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
    
    // Step 4: Generate crossword data
    console.log('Generating crossword data...');
    const crosswordData = await crosswordService.generateCrossword(selectedQuestions);
    
    // Step 5: Create song groups
    console.log('Creating song groups...');
    const songGroups = createSongGroups(selectedQuestions, playlistData.tracks);
    console.log('Generated song groups:', songGroups.length, songGroups);

    // Ensure crossword entries are associated with song groups
    const clueEntryMap = new Map();
    crosswordData.entries.forEach(entry => {
      clueEntryMap.set(entry.clue, entry);
    });

    songGroups.forEach(group => {
      group.crosswordQuestions = group.questions.filter(question => 
        clueEntryMap.has(question.question)
      );
      group.crosswordQuestions.forEach(question => {
        const entry = clueEntryMap.get(question.question);
        question.crosswordEntry = entry; // Associate crossword entry with the question
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
    console.log('Crossword entries:', enhancedCrossword.entries.length);
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

    // Match questions to tracks to assign trackId to each question
    const enhancedQuestions = questions.map(question => {
      // Find the best matching track for this question
      let bestTrack = null;
      let bestScore = 0;
      const questionText = question.question.toLowerCase();

      for (const track of playlistData.tracks) {
        let score = 0;
        // Check if track name is in the question
        if (track.name && questionText.includes(track.name.toLowerCase())) {
          score += 3;
        }
        
        // Check if any artist is mentioned
        if (track.artists) {
          for (const artist of track.artists) {
            if (artist.name && questionText.includes(artist.name.toLowerCase())) {
              score += 2;
            }
          }
        }
        
        // Check if album is mentioned
        if (track.album && track.album.name && 
            questionText.includes(track.album.name.toLowerCase())) {
          score += 1;
        }

        if (score > bestScore) {
          bestScore = score;
          bestTrack = track;
        }
      }

      // Add trackId to the question
      if (bestTrack && bestScore > 0) {
        console.log(`Matched question "${question.question.substring(0, 30)}..." to track "${bestTrack.name}"`);
        return {
          ...question,
          trackId: bestTrack.id,
          trackName: bestTrack.name,
          artists: bestTrack.artists
        };
      }
      
      // No good match found
      console.log(`No track match for question: "${question.question.substring(0, 30)}..."`);
      return question;
    });
    
    // Now create song groups with the enhanced questions
    const songGroups = createSongGroups(enhancedQuestions, playlistData.tracks);

    // Add a general group for unmatched questions if needed
    const unmatchedQuestions = enhancedQuestions.filter(q => !q.trackId);
    if (unmatchedQuestions.length > 0) {
      songGroups.push({
        id: 'general',
        name: 'General Music Knowledge',
        questions: unmatchedQuestions,
        artists: []
      });
    }

    console.log(`Created ${songGroups.length} song groups`);
    
    // Create a map of question text to trackId for easier lookup
    const questionTrackMap = new Map();
    songGroups.forEach(group => {
      group.questions.forEach(question => {
        questionTrackMap.set(question.question, group.id);
      });
    });

    // Enhance crossword entries with trackId
    const enhancedEntries = crosswordData.entries.map(entry => {
      // If entry already has trackId, keep it
      if (entry.trackId) return entry;
      
      // Try to find matching trackId from the question text
      const trackId = questionTrackMap.get(entry.clue);
      
      if (trackId) {
        // Find the corresponding song group to get full track info
        const songGroup = songGroups.find(group => group.id === trackId);
        return {
          ...entry,
          trackId: trackId,
          trackName: songGroup ? songGroup.name : null,
          artists: songGroup ? songGroup.artists : null
        };
      }
      
      return entry;
    });
    
    // Create enhanced crossword
    const enhancedCrossword = {
      ...crosswordData,
      entries: enhancedEntries,
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
    console.log(`Enhanced entries with trackId: ${enhancedEntries.filter(e => e.trackId).length}/${enhancedEntries.length}`);
    console.log(`Song groups created: ${songGroups.length}`);
    
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