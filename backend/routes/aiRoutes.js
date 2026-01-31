const express = require('express');
const router = express.Router();
const { generateContent } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

router.post('/generate', protect, generateContent);

module.exports = router;
