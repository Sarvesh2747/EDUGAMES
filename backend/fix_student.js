const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

const fixStudent = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const divyeshId = '69285f0b874d451cfbb37f6b'; // From previous output
        const sarveshId = '6928a558e1d0712b77e32f72'; // From previous output

        const result = await User.findByIdAndUpdate(
            divyeshId,
            { teacherId: sarveshId },
            { new: true }
        );

        console.log('--- Updated Student ---');
        console.log(`Name: ${result.name}`);
        console.log(`New TeacherID: ${result.teacherId}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

fixStudent();
