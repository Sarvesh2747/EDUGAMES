const bcrypt = require('bcryptjs');
const User = require('../models/User');
const GameResult = require('../models/GameResult');

const restoreUser = async () => {
    try {
        console.log('👤 Restoring Specific User...');

        const email = 'divyeshravane21543@gmail.com';
        const password = 'AVRavr@22'; // From screenshot
        // const hashedPassword = await bcrypt.hash(password, 10); // REMOVED: User model handles hashing via pre-save hook

        // Check if exists
        let user = await User.findOne({ email });
        if (user) {
            console.log('      ⚠️ User already exists, resetting password...');
            user.password = password; // Pass plain password, pre-save hook will hash it
            await user.save();
        } else {
            // Find a teacher to assign
            const teacher = await User.findOne({ role: 'teacher' });

            user = await User.create({
                name: 'Divyesh Ravane',
                email: email,
                password: password, // Pass plain password
                role: 'student',
                status: 'active',
                selectedClass: 9,
                teacherId: teacher ? teacher._id : null,
                learnerCategory: 'fast',
                xp: 1250,
                streak: 5,
            });
            console.log('      ✓ User created successfully');
        }

        // Add some dummy game results
        await GameResult.create({
            userId: user._id,
            gameType: 'cell_command',
            score: 85,
            maxScore: 100,
            xpEarned: 120,
            timeTaken: 150,
            difficulty: 'medium',
            subject: 'Science',
            classLevel: '9',
            delta: 15,
            proficiency: 'Advanced',
            completedLevel: 1,
            attempts: 1
        });

    } catch (error) {
        console.error('      ❌ Error restoring user:', error.message);
    }
};

module.exports = restoreUser;
