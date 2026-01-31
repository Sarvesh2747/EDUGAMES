const Notification = require('../models/Notification');

// Get user's notifications
exports.getNotifications = async (req, res) => {
    try {
        // console.log('Fetching notifications for user:', req.user._id);
        const notifications = await Notification.find({ recipient: req.user._id })
            .sort({ createdAt: -1 })
            .limit(50);

        // console.log(`Found ${notifications.length} notifications`);

        const unreadCount = await Notification.countDocuments({
            recipient: req.user._id,
            isRead: false
        });

        res.json({ notifications, unreadCount });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await Notification.findOne({
            _id: id,
            recipient: req.user._id
        });

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        notification.isRead = true;
        await notification.save();

        res.json({ message: 'Marked as read' });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Mark all as read
exports.markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.user._id, isRead: false },
            { $set: { isRead: true } }
        );
        res.json({ message: 'All marked as read' });
    } catch (error) {
        console.error('Error marking all as read:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Send notification (Internal helper or Admin endpoint)
exports.sendNotification = async (req, res) => {
    try {
        const { recipientId, title, message, type, data } = req.body;
        const senderId = req.user._id;

        // Check if this is a broadcast (all or filtered)
        if (recipientId === 'all' || recipientId === 'filtered') {
            const { filters } = req.body;
            const User = require('../models/User');

            // Build query
            const query = {
                role: 'student',
                // teacherId: senderId
            };

            // Apply filters if present
            if (filters) {
                if (filters.classLevel) query.selectedClass = filters.classLevel;
                if (filters.learnerCategory) query.learnerCategory = filters.learnerCategory;
            }

            // Find students matching query
            // console.log('Broadcasting with query:', query);
            const students = await User.find(query);
            // console.log(`Found ${students.length} students to notify`);

            if (students.length === 0) {
                return res.status(404).json({ message: 'No students found to notify.' });
            }

            // Create notification objects for all students
            const notifications = students.map(student => ({
                recipient: student._id,
                sender: senderId,
                type: type || 'system',
                title,
                message,
                data: data || {},
                createdAt: new Date(),
                isRead: false
            }));

            // Bulk insert
            const result = await Notification.insertMany(notifications);
            // console.log(`Inserted ${result.length} notifications`);

            return res.status(201).json({
                message: `Notification sent to ${students.length} students`
            });
        }

        // Single recipient logic
        const notification = await Notification.create({
            recipient: recipientId,
            sender: req.user._id,
            type,
            title,
            message,
            data
        });

        res.status(201).json(notification);
    } catch (error) {
        console.error('Error sending notification:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get sent notifications history
exports.getSentHistory = async (req, res) => {
    try {
        const history = await Notification.aggregate([
            { $match: { sender: req.user._id } },
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: {
                        title: '$title',
                        message: '$message',
                        type: '$type',
                        // Group by minute to catch broadcasts
                        timeBlock: {
                            $dateToString: { format: '%Y-%m-%d %H:%M', date: '$createdAt' }
                        }
                    },
                    id: { $first: '$_id' }, // Keep one ID for reference
                    createdAt: { $first: '$createdAt' },
                    count: { $sum: 1 },
                    recipients: { $push: '$recipient' }
                }
            },
            { $sort: { createdAt: -1 } },
            { $limit: 10 }
        ]);

        res.json(history.map(h => ({
            _id: h.id,
            title: h._id.title,
            message: h._id.message,
            type: h._id.type,
            createdAt: h.createdAt,
            recipientCount: h.count
        })));
    } catch (error) {
        console.error('Error fetching sent history:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update a sent notification (and its peers)
exports.updateSentNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, message } = req.body;

        const original = await Notification.findById(id);
        if (!original) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        if (original.sender.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        // Find peer notifications (same sender, same original content, similar time)
        // We use a small time window (e.g., +/- 1 minute) to match the batch
        const timeWindow = 60 * 1000; // 1 minute
        const startTime = new Date(original.createdAt.getTime() - timeWindow);
        const endTime = new Date(original.createdAt.getTime() + timeWindow);

        const result = await Notification.updateMany(
            {
                sender: req.user._id,
                title: original.title,
                message: original.message,
                createdAt: { $gte: startTime, $lte: endTime }
            },
            {
                $set: { title, message }
            }
        );

        res.json({ message: `Updated ${result.modifiedCount} notifications` });
    } catch (error) {
        console.error('Error updating notification:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete a sent notification (and its peers)
exports.deleteSentNotification = async (req, res) => {
    try {
        const { id } = req.params;

        const original = await Notification.findById(id);
        if (!original) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        if (original.sender.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        // Find peers to delete batch
        const timeWindow = 60 * 1000; // 1 minute
        const startTime = new Date(original.createdAt.getTime() - timeWindow);
        const endTime = new Date(original.createdAt.getTime() + timeWindow);

        const result = await Notification.deleteMany({
            sender: req.user._id,
            title: original.title,
            message: original.message,
            createdAt: { $gte: startTime, $lte: endTime }
        });

        res.json({ message: `Deleted ${result.deletedCount} notifications` });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Internal helper to create notification
exports.createNotification = async ({ recipient, sender, type, title, message, data }) => {
    try {
        await Notification.create({
            recipient,
            sender,
            type,
            title,
            message,
            data
        });
    } catch (error) {
        console.error('Error creating internal notification:', error);
    }
};

// Exports are handled inline above
