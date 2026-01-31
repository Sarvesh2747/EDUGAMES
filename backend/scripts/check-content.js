const mongoose = require('mongoose');
const User = require('../models/User');
const TeacherChapter = require('../models/TeacherChapter');
const TeacherQuiz = require('../models/TeacherQuiz');
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

const checkData = async () => {
    await connectDB();

    const studentEmail = 'divyeshravane21543@gmail.com';
    const teacherEmail = 'sarvesh@gmail.com';

    try {
        const student = await User.findOne({ email: studentEmail }).populate('teacherId');
        const teacher = await User.findOne({ email: teacherEmail });

        if (!student) {
            console.log('Student not found');
            return;
        }

        console.log(`Student: ${student.name}`);
        console.log(`Selected Class: ${student.selectedClass}`);
        console.log(`Assigned Teacher: ${student.teacherId ? student.teacherId.name : 'None'}`);

        if (!teacher) {
            console.log('Teacher not found');
            return;
        }

        console.log(`\nChecking content for Teacher: ${teacher.name} (${teacher._id})`);

        const chapters = await TeacherChapter.find({ teacherId: teacher._id });
        console.log(`Total Chapters created by teacher: ${chapters.length}`);
        chapters.forEach(c => {
            console.log(` - Chapter: ${c.title} (Class: ${c.classNumber})`);
        });

        const quizzes = await TeacherQuiz.find({ teacherId: teacher._id });
        console.log(`Total Quizzes created by teacher: ${quizzes.length}`);
        quizzes.forEach(q => {
            console.log(` - Quiz: ${q.title} (Class: ${q.classNumber})`);
        });

        // Check if content matches student class
        const matchingChapters = chapters.filter(c => String(c.classNumber) === String(student.selectedClass));
        const matchingQuizzes = quizzes.filter(q => String(q.classNumber) === String(student.selectedClass));

        console.log(`\nMatches for Student Class (${student.selectedClass}):`);
        console.log(` - Chapters: ${matchingChapters.length}`);
        console.log(` - Quizzes: ${matchingQuizzes.length}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

checkData();
