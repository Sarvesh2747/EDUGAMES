const mongoose = require('mongoose');
const Notification = require('./models/Notification');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

const checkNotifications = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // 1. Get recent notifications
        const notifications = await Notification.find().sort({ createdAt: -1 }).limit(5).populate('recipient', 'name email role').populate('sender', 'name email role');

        console.log('\n--- Recent Notifications ---');
        if (notifications.length === 0) {
            console.log('No notifications found.');
        } else {
            notifications.forEach(n => {
                console.log(`ID: ${n._id}`);
                console.log(`Title: ${n.title}`);
                console.log(`Message: ${n.message}`);
                console.log(`To: ${n.recipient?.name} (${n.recipient?.role})`);
                console.log(`From: ${n.sender?.name} (${n.sender?.role})`);
                console.log(`Created: ${n.createdAt}`);
                console.log('-------------------------');
            });
        }

        // 2. Check Teacher-Student Relationships
        console.log('\n--- Teacher-Student Links ---');
        const students = await User.find({ role: 'student' });
        students.forEach(s => {
            console.log(`Student: ${s.name}, TeacherID: ${s.teacherId}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

checkNotifications();
