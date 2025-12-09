const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

const checkStudent = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Find student "Divyesh" (case insensitive search)
        const student = await User.findOne({
            name: { $regex: /divyesh/i },
            role: 'student'
        });

        if (!student) {
            console.log('Student "Divyesh" not found.');
        } else {
            console.log('--- Student Details ---');
            console.log(`ID: ${student._id}`);
            console.log(`Name: ${student.name}`);
            console.log(`Email: ${student.email}`);
            console.log(`TeacherID: ${student.teacherId}`);
            console.log(`Class: ${student.selectedClass}`);
        }

        // Find Teacher "Sarvesh"
        const teacher = await User.findOne({
            name: { $regex: /sarvesh/i },
            role: 'teacher'
        });

        if (teacher) {
            console.log('\n--- Teacher Details ---');
            console.log(`ID: ${teacher._id}`);
            console.log(`Name: ${teacher.name}`);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

checkStudent();
