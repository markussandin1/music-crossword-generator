import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: 'http://localhost:3000/api', // Make sure this matches your backend port
  headers: {
    'Content-Type': 'application/json',
  },
});

// API functions for Spotify integration
export const spotifyApi = {
  getPlaylistData: (playlistUrl) => api.post('/playlist', { playlistUrl }),
};

// API functions for question generation
export const questionApi = {
  generateQuestions: (trackData, options) => api.post('/generate-questions', { trackData, options }),
};

// API functions for crossword generation
export const crosswordApi = {
  buildCrossword: (questions) => api.post('/build-crossword', { questions }),
  
  // New methods for interactive crossword features
  saveProgress: (playlistId, answers) => api.post('/save-progress', { 
    playlistId, 
    answers 
  }),
  
  loadProgress: (playlistId) => api.get(`/progress/${playlistId}`),
  
  shareProgress: (playlistId, crosswordData, answers) => api.post('/share', {
    playlistId,
    crosswordData,
    answers
  }),
  
  getSharedCrossword: (shareId) => api.get(`/shared/${shareId}`)
};

// Export the axios instance for custom requests
export default api;
