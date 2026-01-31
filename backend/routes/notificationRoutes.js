const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead, markAllAsRead, sendNotification, getSentHistory, updateSentNotification, deleteSentNotification } = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/sent', getSentHistory);
router.post('/send', sendNotification); // POST /send
router.put('/read-all', markAllAsRead); // PUT /read-all
router.put('/:id/read', markAsRead); // PUT /:id/read
router.put('/sent/:id', updateSentNotification);
router.delete('/sent/:id', deleteSentNotification);
router.get('/', getNotifications); // Catch-all GET / last

module.exports = router;
