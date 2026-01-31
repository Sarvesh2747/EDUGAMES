const mongoose = require('mongoose');
const User = require('../models/User');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const updateStudentClass = async () => {
    await connectDB();

    // Correcting the likely typo in user request: divyeshravane@21543gmail.com -> divyeshravane21543@gmail.com
    const studentEmail = 'divyeshravane21543@gmail.com';
    const newClass = 10;

    try {
        const student = await User.findOne({ email: studentEmail });

        if (!student) {
            console.error(`Student not found: ${studentEmail}`);
            process.exit(1);
        }

        console.log(`Current Class: ${student.selectedClass}`);
        student.selectedClass = newClass;
        await student.save();

        console.log(`Successfully updated class for ${student.name} (${student.email}) to Class ${newClass}`);

    } catch (error) {
        console.error('Error updating class:', error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

updateStudentClass();
