// frontend/src/services/api.js

import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: '/api'
});

// Spotify API endpoints
export const spotifyApi = {
  getPlaylistData: (url) => {
    return api.post('/playlist', { playlistUrl: url });
  }
};

// Question API endpoints
export const questionApi = {
  generateQuestions: (tracks) => {
    return api.post('/generate-questions', { trackData: tracks });
  }
};

// Crossword API endpoints
export const crosswordApi = {
  buildCrossword: (questions) => {
    return api.post('/build-crossword', { questions });
  }
};

// Lucky crossword
export const luckyApi = {
  createLuckyCrossword: (url) => {
    return api.post('/lucky-crossword', { playlistUrl: url });
  },
  
  // Create a quiz from an existing crossword
  createQuizFromCrossword: (data) => {
    return api.post('/create-quiz-from-crossword', {
      crosswordData: data.crosswordData,
      questions: data.questions,
      playlistData: data.playlistData
    });
  }
};

// Quiz-specific endpoints
export const quizApi = {
  // Get song groups for a playlist
  getSongGroups: (playlistId) => {
    return api.get(`/song-groups/${playlistId}`);
  },
  
  // Save quiz results
  saveQuizResults: (quizId, results) => {
    return api.post(`/quiz-results/${quizId}`, { results });
  },
  
  // Get audio preview URL from Spotify
  getAudioPreview: (trackId) => {
    return api.get(`/audio-preview/${trackId}`);
  }
};

// NEW: Text-to-Speech API endpoints
export const ttsApi = {
  // Generate speech from text with enhanced options
  generateSpeech: (text, options = {}) => {
    const {
      voice = 'coral',
      model = 'gpt-4o-mini-tts',
      responseFormat = 'mp3',
      instructions = ''
    } = options;
    
    return api.post('/tts', 
      { 
        text, 
        voice, 
        model,
        responseFormat,
        instructions
      }, 
      {
        responseType: 'blob' // Important for handling binary audio data
      }
    );
  },
  
  // Get available voices
  getVoices: () => {
    return api.get('/tts/voices');
  },
  
  // Test if TTS service is available
  checkStatus: () => {
    return api.get('/tts/status');
  }
};

// Export the axios instance if needed
export default api;