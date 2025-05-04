// backend/src/routes/api.js

const express = require('express');
const router = express.Router();
const playlistController = require('../controllers/playlistController');
const questionController = require('../controllers/questionController');
const crosswordController = require('../controllers/crosswordController');
const luckyController = require('../controllers/luckyController');
const quizController = require('../controllers/quizController');
const ttsController = require('../controllers/ttsController');

// Default route for testing
router.get('/', (req, res) => {
  res.json({ message: 'Music Crossword API is running' });
});

// Playlist routes
router.post('/playlist', playlistController.getPlaylistData);

// Question generation routes
router.post('/generate-questions', questionController.generateQuestions);

// Crossword routes
router.post('/build-crossword', crosswordController.buildCrossword);

// Lucky crossword routes
router.post('/lucky-crossword', luckyController.createLuckyCrossword);

// Quiz-specific routes
router.post('/create-quiz-from-crossword', luckyController.createQuizFromCrossword);
router.get('/song-groups/:playlistId', quizController.getSongGroups);
router.post('/quiz-results/:quizId', quizController.saveQuizResults);
router.get('/audio-preview/:trackId', quizController.getAudioPreview);

// TTS routes
router.post('/tts', ttsController.generateSpeech);
router.get('/tts/voices', ttsController.getVoices);
router.get('/tts/status', ttsController.checkStatus);

module.exports = router;