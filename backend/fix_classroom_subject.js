require('dotenv').config();
const mongoose = require('mongoose');

const Classroom = mongoose.model('Classroom', new mongoose.Schema({}, { strict: false }));

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log('\n--- CORRECTING CLASSROOM SUBJECT ---');
        // Targeted ID from previous successful diagnosis
        const targetId = '697e561a07737caa5c95b93a';

        // This time, I will force set it to "Math" and verify the change
        // The user says "change that classroom to math" and "why i am seeing social"

        const result = await Classroom.updateOne(
            { _id: targetId },
            { $set: { subject: 'Math', title: 'Class 10 Math' } } // Also updating title to be clear
        );

        console.log('Update Result:', result);

        const cls = await Classroom.findById(targetId);
        console.log(`VERIFICATION: Subject is now: ${cls.subject}`);
        console.log(`VERIFICATION: Title is now: ${cls.title}`);

        mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
};

run();
