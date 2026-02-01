const express = require('express');
const router = express.Router();
const { getStudentTasks, getQuizById, submitQuizResult, getClassroomContent, getClassroomsList, joinClassroom } = require('../controllers/studentController');
const { protect } = require('../middleware/auth');

router.get('/tasks', protect, getStudentTasks);
router.get('/classrooms-list', protect, getClassroomsList);
router.get('/classroom', protect, getClassroomContent);
router.get('/quiz/:id', protect, getQuizById);
router.post('/quiz/submit', protect, submitQuizResult);
router.post('/join-classroom', protect, joinClassroom);
router.get('/live-classes', protect, require('../controllers/studentController').getStudentLiveClasses);

module.exports = router;
