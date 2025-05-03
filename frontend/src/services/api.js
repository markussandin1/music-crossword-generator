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
    return api.post('/generate-questions', { trackData: tracks }); // Changed 'tracks' to 'trackData'
  }
};

// Crossword API endpoints
export const crosswordApi = {
  buildCrossword: (questions) => {
    return api.post('/build-crossword', { questions });
  }
};

// Export the axios instance if needed
export default api;