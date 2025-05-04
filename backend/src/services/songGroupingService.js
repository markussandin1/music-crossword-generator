// backend/src/services/songGroupingService.js

/**
 * Service for grouping questions by their related songs
 * and organizing playlist data for quiz functionality
 */

/**
 * Match questions to specific tracks in the playlist
 * @param {Array} questions - Generated questions with answers
 * @param {Array} tracks - Tracks from the playlist
 * @returns {Array} - Questions with track associations
 */
const associateQuestionsWithTracks = (questions, tracks) => {
    if (!questions || !tracks || !Array.isArray(questions) || !Array.isArray(tracks)) {
      console.error('Invalid input to associateQuestionsWithTracks');
      return questions;
    }
  
    const enhancedQuestions = [];
    
    // Create a searchable version of each track with normalized text
    const searchableTracks = tracks.map(track => ({
      ...track,
      searchableTitle: normalizeText(track.name),
      searchableArtists: track.artists.map(artist => normalizeText(artist.name)),
      searchableAlbum: normalizeText(track.album.name)
    }));
  
    // Process each question to find relevant track
    for (const question of questions) {
      // Skip invalid questions
      if (!question.question || !question.answer) {
        continue;
      }
  
      const searchableQuestion = normalizeText(question.question);
      const searchableAnswer = normalizeText(question.answer);
      let bestMatch = null;
      let highestScore = 0;
      
      // Check each track for relevance to this question
      for (const track of searchableTracks) {
        const matchScore = calculateMatchScore(
          searchableQuestion, 
          searchableAnswer,
          track
        );
        
        if (matchScore > highestScore) {
          highestScore = matchScore;
          bestMatch = track;
        }
      }
      
      // Add track association if we found a good match
      if (bestMatch && highestScore > 0.1) {
        enhancedQuestions.push({
          ...question,
          trackId: bestMatch.id,
          trackName: bestMatch.name,
          artists: bestMatch.artists,
          matchScore: highestScore,
          albumName: bestMatch.album.name,
          previewUrl: bestMatch.previewUrl
        });
      } else {
        // No clear association - mark as general music knowledge
        enhancedQuestions.push({
          ...question,
          trackId: null,
          matchScore: 0
        });
      }
    }
  
    return enhancedQuestions;
  };
  
  /**
   * Calculate match score between a question and a track
   * Higher score means better match
   * @param {string} question - Normalized question text
   * @param {string} answer - Normalized answer text
   * @param {Object} track - Track with searchable fields
   * @returns {number} - Match score (0-1)
   */
  const calculateMatchScore = (question, answer, track) => {
    let score = 0;
    
    // Check for track title in question
    if (question.includes(track.searchableTitle)) {
      score += 0.5;
    }
    
    // Check for artist mentions
    for (const artist of track.searchableArtists) {
      if (question.includes(artist)) {
        score += 0.4;
      }
      if (answer.includes(artist)) {
        score += 0.3;
      }
    }
    
    // Check for album mention
    if (question.includes(track.searchableAlbum)) {
      score += 0.3;
    }
    
    // Check if answer is related to track name
    if (track.searchableTitle.includes(answer) || answer.includes(track.searchableTitle)) {
      score += 0.4;
    }
    
    // Check for specific words that indicate song reference
    const songReferenceTerms = [
      'track', 'song', 'single', 'hit', 'released', 'sang', 'performed',
      'lyrics', 'album', 'melody', 'tune', 'vocalist', 'singer', 'band'
    ];
    
    for (const term of songReferenceTerms) {
      if (question.includes(term)) {
        score += 0.1;
        break;
      }
    }
    
    // Cap score at 1.0
    return Math.min(score, 1.0);
  };
  
  /**
   * Organize tracks and questions into song groups
   * @param {Array} associatedQuestions - Questions with track associations
   * @param {Array} tracks - Original track list
   * @returns {Array} - Song groups with questions
   */
  const createSongGroups = (associatedQuestions, tracks) => {
    // Initialize map of trackId -> questions
    const groupMap = new Map();
    
    // Create a general knowledge group for questions not tied to specific tracks
    const generalKnowledgeGroup = {
      id: 'general',
      name: 'General Music Knowledge',
      questions: []
    };
    
    // Group questions by track
    for (const question of associatedQuestions) {
      if (!question.trackId) {
        generalKnowledgeGroup.questions.push(question);
        continue;
      }
      
      if (!groupMap.has(question.trackId)) {
        groupMap.set(question.trackId, []);
      }
      
      groupMap.get(question.trackId).push(question);
    }
    
    // Convert map to array of song groups
    const songGroups = [];
    for (const [trackId, questions] of groupMap.entries()) {
      // Find track data
      const track = tracks.find(t => t.id === trackId);
      if (!track) continue;
      
      songGroups.push({
        id: trackId,
        name: track.name,
        artists: track.artists,
        album: track.album,
        previewUrl: track.previewUrl,
        popularityScore: track.popularityScore,
        questions: questions,
        imageUrl: track.album.images?.[0]?.url || null
      });
    }
    
    // Sort groups by number of questions (descending)
    songGroups.sort((a, b) => b.questions.length - a.questions.length);
    
    // Add general knowledge at the end if it has questions
    if (generalKnowledgeGroup.questions.length > 0) {
      songGroups.push(generalKnowledgeGroup);
    }
    
    return songGroups;
  };
  
  /**
   * Enhance crossword data with song grouping information
   * @param {Object} crosswordData - Original crossword data
   * @param {Array} songGroups - Song groups with questions
   * @returns {Object} - Enhanced crossword data
   */
  const enhanceCrosswordWithSongGroups = (crosswordData, songGroups) => {
    if (!crosswordData || !crosswordData.entries || !Array.isArray(crosswordData.entries)) {
      console.error('Invalid crossword data');
      return crosswordData;
    }
    
    // Create a lookup map of clue -> track info
    const clueTrackMap = new Map();
    
    // Populate map with all clues from song groups
    for (const group of songGroups) {
      for (const question of group.questions) {
        clueTrackMap.set(question.question, {
          trackId: group.id,
          trackName: group.name,
          artists: group.artists,
          albumName: group.album?.name,
          previewUrl: group.previewUrl,
          imageUrl: group.imageUrl
        });
      }
    }
    
    // Enhance each crossword entry with track information
    const enhancedEntries = crosswordData.entries.map(entry => {
      const trackInfo = clueTrackMap.get(entry.clue);
      
      if (trackInfo) {
        return {
          ...entry,
          ...trackInfo
        };
      }
      
      return entry;
    });
    
    return {
      ...crosswordData,
      entries: enhancedEntries,
      songGroups: songGroups
    };
  };
  
  /**
   * Process playlist data to create all necessary
   * music quiz data for the crossword
   * @param {Array} questions - Generated questions
   * @param {Object} playlistData - Playlist data from Spotify
   * @param {Object} crosswordData - Generated crossword data
   * @returns {Object} - Enhanced crossword data for quiz
   */
  const processPlaylistForQuiz = (questions, playlistData, crosswordData) => {
    // Basic validation
    if (!questions || !playlistData || !playlistData.tracks || !crosswordData) {
      console.error('Missing required data for quiz processing');
      return crosswordData;
    }
    
    // Associate questions with specific tracks
    const associatedQuestions = associateQuestionsWithTracks(
      questions,
      playlistData.tracks
    );
    
    // Create song groups
    const songGroups = createSongGroups(
      associatedQuestions, 
      playlistData.tracks
    );
    
    // Enhance crossword data with song groups
    const enhancedCrossword = enhanceCrosswordWithSongGroups(
      crosswordData,
      songGroups
    );
    
    // Add playlist information
    enhancedCrossword.playlist = {
      id: playlistData.id,
      name: playlistData.name,
      description: playlistData.description,
      owner: playlistData.owner,
      images: playlistData.images,
      tracksCount: playlistData.tracksCount
    };
    
    return enhancedCrossword;
  };
  
  /**
   * Normalize text for better matching
   * @param {string} text - Text to normalize
   * @returns {string} - Normalized text
   */
  const normalizeText = (text) => {
    if (!text) return '';
    return text.toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ')    // Normalize whitespace
      .trim();
  };
  
  module.exports = {
    associateQuestionsWithTracks,
    createSongGroups,
    enhanceCrosswordWithSongGroups,
    processPlaylistForQuiz
  };