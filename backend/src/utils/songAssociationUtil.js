// backend/src/utils/songAssociationUtil.js

/**
 * Associate questions with tracks and create song groups
 * @param {Array} questions - Questions selected for the crossword
 * @param {Array} tracks - Tracks from the playlist
 * @returns {Object} - Associations and song groups
 */
const associateQuestionsWithTracks = (questions, tracks) => {
    console.log(`Associating ${questions.length} questions with ${tracks.length} tracks`);
    
    // Match questions to tracks
    const enhancedQuestions = questions.map(question => {
      let bestTrack = null;
      let bestScore = 0;
      const questionText = question.question.toLowerCase();
  
      for (const track of tracks) {
        let score = 0;
        
        // Track name matching
        if (track.name && questionText.includes(track.name.toLowerCase())) {
          score += 3;
        }
        
        // Artist matching
        if (track.artists) {
          for (const artist of track.artists) {
            if (artist.name && questionText.includes(artist.name.toLowerCase())) {
              score += 2;
            }
          }
        }
        
        // Album matching
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
        return {
          ...question,
          trackId: bestTrack.id,
          trackName: bestTrack.name,
          artists: bestTrack.artists
        };
      }
      
      return {
        ...question,
        trackId: 'general'
      };
    });
  
    // Create song groups
    const trackGroups = new Map();
    
    // Initialize general group
    trackGroups.set('general', {
      id: 'general',
      name: 'General Music Knowledge',
      questions: [],
      artists: []
    });
    
    // Initialize groups for each track
    tracks.forEach(track => {
      trackGroups.set(track.id, {
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
    
    // Add questions to groups
    enhancedQuestions.forEach(question => {
      if (question.trackId && trackGroups.has(question.trackId)) {
        trackGroups.get(question.trackId).questions.push(question);
      } else {
        trackGroups.get('general').questions.push(question);
      }
    });
    
    // Convert to array and filter empty groups
    const songGroups = Array.from(trackGroups.values())
      .filter(group => group.questions.length > 0);
    
    return {
      enhancedQuestions,
      songGroups
    };
  };
  
  /**
   * Associate crossword entries with song groups
   * @param {Object} crosswordData - Generated crossword data
   * @param {Array} songGroups - Song groups with questions
   * @returns {Object} - Enhanced crossword with track associations
   */
  const enhanceCrosswordWithSongGroups = (crosswordData, songGroups) => {
    // Create a map for quick lookups
    const questionClueMap = new Map();
    
    // Map each question to its associated track
    songGroups.forEach(group => {
      group.questions.forEach(question => {
        questionClueMap.set(question.question, {
          trackId: group.id,
          trackName: group.name,
          artists: group.artists
        });
      });
    });
    
    // Enhance crossword entries with track info
    const enhancedEntries = crosswordData.entries.map(entry => {
      const trackInfo = questionClueMap.get(entry.clue);
      
      if (trackInfo) {
        return {
          ...entry,
          ...trackInfo
        };
      }
      
      return entry;
    });
    
    // Create enhanced crossword
    return {
      ...crosswordData,
      entries: enhancedEntries,
      songGroups
    };
  };
  
  module.exports = {
    associateQuestionsWithTracks,
    enhanceCrosswordWithSongGroups
  };