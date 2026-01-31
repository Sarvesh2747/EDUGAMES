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

const assignTeacher = async () => {
    await connectDB();

    const studentEmail = 'divyeshravane21543@gmail.com';
    const teacherEmail = 'sarvesh@gmail.com';

    try {
        const student = await User.findOne({ email: studentEmail });
        const teacher = await User.findOne({ email: teacherEmail });

        if (!student) {
            console.error(`Student not found: ${studentEmail}`);
            process.exit(1);
        }

        if (!teacher) {
            console.error(`Teacher not found: ${teacherEmail}`);
            process.exit(1);
        }

        // Check if teacher is configured as a teacher
        if (teacher.role !== 'teacher' && teacher.role !== 'admin') {
            console.warn(`Warning: The user ${teacherEmail} has role '${teacher.role}', not 'teacher'. Proceeding anyway...`);
        }

        student.teacherId = teacher._id;
        await student.save();

        console.log(`Successfully assigned student ${student.name} (${student.email}) to teacher ${teacher.name} (${teacher.email})`);

    } catch (error) {
        console.error('Error assigning teacher:', error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

assignTeacher();
