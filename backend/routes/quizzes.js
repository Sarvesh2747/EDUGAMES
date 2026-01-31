const express = require('express');
const router = express.Router();
const { getRandomQuiz, submitQuizResult, getTopicQuiz, generateQuizAI } = require('../controllers/quizController');
const { protect } = require('../middleware/auth');

router.get('/', getTopicQuiz);
router.get('/random', getRandomQuiz);
router.post('/generate-ai', protect, generateQuizAI);
router.post('/submit', protect, submitQuizResult);

module.exports = router;
