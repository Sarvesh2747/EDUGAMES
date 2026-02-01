require('dotenv').config();
const mongoose = require('mongoose');

// Use empty schema with strict: false to update RAW data
const Classroom = mongoose.model('Classroom', new mongoose.Schema({}, { strict: false }));

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log('\n--- UPDATING CLASSROOM SUBJECT ---');
        // Find the 'Class 10' classroom (ID from previous steps)
        const targetId = '697e561a07737caa5c95b93a';

        console.log(`Targeting Classroom ID: ${targetId}`);

        // Update subject to "Mathematics" (or "Math") - The user's screenshot showed "Social", 
        // but the DB showed "Math" in previous logs. 
        // Wait, output in Step 769 said "Subject: Math".
        // The USER screenshot shows "Social".
        // This implies there are TWO classrooms or the user is looking at a different one?

        // Let's search if there is a "Social" classroom first
        const socialClass = await Classroom.findOne({ subject: { $regex: /Social/i }, title: { $regex: /Class 10/i } });

        if (socialClass) {
            console.log(`Found a Social Classroom! ID: ${socialClass._id}, Title: ${socialClass.title}`);
            // Force this one to Math?
            // User request: "change that classroom to math"
            const result = await Classroom.updateOne(
                { _id: socialClass._id },
                { $set: { subject: 'Math' } }
            );
            console.log('Updated Social classroom to Math:', result);
        } else {
            // If we can't find a Social classroom, maybe the user is enrolled in one 
            // that my regex didn't catch?
            // Or maybe they want the "Math" classroom (ID ...93a) which IS Math?
            // But they said "change that classroom to math".
            // Assuming they are stuck on a classroom that says "Social".

            // I will update the one I know about (ID ...93a) to be sure it is 'Math'
            const result = await Classroom.updateOne(
                { _id: targetId },
                { $set: { subject: 'Math' } }
            );
            console.log(`Ensured Classroom ${targetId} is Math. Result:`, result);
        }

        mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
};

run();
