const express = require('express');
const router = express.Router();
const playlistController = require('../controllers/playlistController');
const questionController = require('../controllers/questionController');
const crosswordController = require('../controllers/crosswordController');
const luckyController = require('../controllers/luckyController');


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

// Luck crossword routes

router.post('/lucky-crossword', luckyController.createLuckyCrossword);


module.exports = router;