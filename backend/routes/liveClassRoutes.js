const express = require('express');
const router = express.Router();
const { scheduleClass, getLiveClasses } = require('../controllers/liveClassController');
const { protect, teacherOnly } = require('../middleware/auth');

router.post('/schedule', protect, teacherOnly, scheduleClass);
router.get('/classroom/:classId', protect, getLiveClasses);

module.exports = router;
