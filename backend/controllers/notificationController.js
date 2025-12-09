const Notification = require('../models/Notification');

// Get user's notifications
exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.user._id })
            .sort({ createdAt: -1 })
            .limit(50);

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

        // Check if this is a broadcast to all students
        if (recipientId === 'all') {
            const User = require('../models/User');
            // Find all students assigned to this teacher
            const students = await User.find({
                role: 'student',
                teacherId: senderId
            });

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
            await Notification.insertMany(notifications);

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
