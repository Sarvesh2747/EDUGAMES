const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    uploadDocument,
    getDocuments,
    getDocumentById,
    analyzeDocument,
    generateFlashcards,
    generateQuiz,
    deleteContent
} = require('../controllers/notebookController');

router.use(protect); // All routes protected

router.route('/')
    .get(getDocuments);

router.post('/upload', uploadDocument);

router.route('/:id')
    .get(getDocumentById)
    .delete(deleteContent);

router.post('/:id/analyze', analyzeDocument);
router.post('/:id/flashcards', generateFlashcards);
router.post('/:id/quiz', generateQuiz);

module.exports = router;
