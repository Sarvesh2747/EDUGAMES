require('dotenv').config();
const mongoose = require('mongoose');

// Use empty schema with strict: false
const TeacherChapter = mongoose.model('TeacherChapter', new mongoose.Schema({}, { strict: false }));
const TeacherQuiz = mongoose.model('TeacherQuiz', new mongoose.Schema({}, { strict: false }));
const LiveClass = mongoose.model('LiveClass', new mongoose.Schema({}, { strict: false }));

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log('\n--- CORRECTING CONTENT SUBJECTS (Social -> Math) ---');

        // 1. Update TeacherChapters
        const chapters = await TeacherChapter.updateMany(
            { $or: [{ subject: { $regex: /Social/i } }, { classNumber: 60 }] },
            { $set: { subject: 'Math', classNumber: '10' } }
        );
        console.log(`Updated Chapters: ${chapters.modifiedCount}`);

        // 2. Update TeacherQuizzes
        const quizzes = await TeacherQuiz.updateMany(
            { $or: [{ subject: { $regex: /Social/i } }, { classNumber: 60 }] },
            { $set: { subject: 'Math', classNumber: '10' } }
        );
        console.log(`Updated Quizzes: ${quizzes.modifiedCount}`);

        // 3. Update LiveClasses
        const liveClasses = await LiveClass.updateMany(
            { $or: [{ subject: { $regex: /Social/i } }] }, // LiveClass doesn't usually have classNumber but has subject
            { $set: { subject: 'Math' } }
        );
        console.log(`Updated LiveClasses: ${liveClasses.modifiedCount}`);

        mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
};

run();
