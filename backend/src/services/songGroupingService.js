/**
 * Match questions to specific tracks in the playlist
 * @param {Array} questions - Generated questions with answers
 * @param {Array} tracks - Tracks from the playlist
 * @returns {Array} - Questions with track associations
 */
const associateQuestionsWithTracks = (questions, tracks) => {
  if (!questions || !tracks || !Array.isArray(questions) || !Array.isArray(tracks)) {
    throw new Error('Invalid input to associateQuestionsWithTracks');
  }

  console.log(`Associating ${questions.length} questions with ${tracks.length} tracks...`);

  const enhancedQuestions = [];
  const searchableTracks = tracks.map(track => ({
    ...track,
    searchableTitle: normalizeText(track.name),
    searchableArtists: track.artists.map(artist => normalizeText(artist.name)),
    searchableAlbum: normalizeText(track.album.name)
  }));

  for (const question of questions) {
    if (!question.question || !question.answer) {
      throw new Error(`Invalid question: ${JSON.stringify(question)}`);
    }

    const searchableQuestion = normalizeText(question.question);
    const searchableAnswer = normalizeText(question.answer);
    let bestMatch = null;
    let highestScore = 0;

    for (const track of searchableTracks) {
      const matchScore = calculateMatchScore(searchableQuestion, searchableAnswer, track);
      if (matchScore > highestScore) {
        highestScore = matchScore;
        bestMatch = track;
      }
    }

    if (bestMatch) {
      enhancedQuestions.push({
        ...question,
        trackId: bestMatch.id,
        trackName: bestMatch.name,
        artists: bestMatch.artists,
        matchScore: highestScore,
        albumName: bestMatch.album.name,
        previewUrl: bestMatch.previewUrl
      });
    } else if (tracks.length > 0) {
      const fallbackTrack = tracks[0];
      enhancedQuestions.push({
        ...question,
        trackId: fallbackTrack.id,
        trackName: fallbackTrack.name,
        artists: fallbackTrack.artists,
        matchScore: 0.05,
        albumName: fallbackTrack.album.name,
        previewUrl: fallbackTrack.previewUrl
      });
    }
  }

  console.log(`Successfully associated ${enhancedQuestions.length} questions with tracks`);
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
  const groupMap = new Map();

  // Group questions by track
  for (const question of associatedQuestions) {
    if (!question.trackId) {
      throw new Error(`Question "${question.question}" is not associated with any track`);
    }

    if (!groupMap.has(question.trackId)) {
      groupMap.set(question.trackId, []);
    }

    groupMap.get(question.trackId).push(question);
  }

  // Convert map to array of song groups
  const songGroups = [];
  for (const [trackId, questions] of groupMap.entries()) {
    const track = tracks.find(t => t.id === trackId);
    if (!track) {
      throw new Error(`Track with ID "${trackId}" not found`);
    }

    songGroups.push({
      id: trackId,
      name: track.name,
      artists: track.artists,
      album: track.album,
      previewUrl: track.previewUrl,
      popularityScore: track.popularityScore,
      questions,
      imageUrl: track.album.images?.[0]?.url || null
    });
  }

  // Sort groups by number of questions (descending)
  songGroups.sort((a, b) => b.questions.length - a.questions.length);

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
    throw new Error('Invalid crossword data');
  }

  console.log(`Enhancing crossword with ${songGroups.length} song groups...`);

  // Create a lookup map of clue -> track info
  const clueTrackMap = new Map();
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

  // Enhance entries and enforce strict matching
  const enhancedEntries = crosswordData.entries.map(entry => {
    if (entry.trackId) {
      return entry; // Keep existing trackId
    }

    // Attempt to find a match using the clue text
    const trackInfo = clueTrackMap.get(entry.clue);
    if (trackInfo) {
      return {
        ...entry,
        ...trackInfo
      };
    }

    // If no match is found, throw an error
    throw new Error(`Unmatched crossword entry: "${entry.clue}"`);
  });

  console.log(`${enhancedEntries.filter(entry => entry.trackId).length} of ${enhancedEntries.length} entries have valid track IDs`);

  return {
    ...crosswordData,
    entries: enhancedEntries,
    songGroups
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
  calculateMatchScore,
  createSongGroups,
  enhanceCrosswordWithSongGroups,
  processPlaylistForQuiz,
  normalizeText
};