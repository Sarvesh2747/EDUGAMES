require('dotenv').config();
const mongoose = require('mongoose');

// Use empty schema with strict: false to see RAW data
const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
const Classroom = mongoose.model('Classroom', new mongoose.Schema({}, { strict: false }));
const LiveClass = mongoose.model('LiveClass', new mongoose.Schema({}, { strict: false }));

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log('\n--- TARGET CLASSROOM INSPECTION (POST-FIX) ---');
        // Find the 'Class 10' classroom (should be updated)
        const cls = await Classroom.findOne({ title: { $regex: /Class 10/i } });

        if (cls) {
            console.log('Raw Classroom Document:');
            console.log(`ID: ${cls._id}`);
            console.log(`Title: ${cls.title}`);
            console.log(`Subject: ${cls.subject}`);
            console.log(`classNumber: ${cls.classNumber} (Type: ${typeof cls.classNumber})`);

            // Check Query Match again
            const q1 = await Classroom.find({ classNumber: 10 });
            console.log(`Query { classNumber: 10 } matches: ${q1.length}`);

            // Check Live Classes linked to this Classroom
            const liveClasses = await LiveClass.find({ classId: cls._id });
            console.log(`\n--- LIVE CLASSES LINKED TO THIS CLASSROOM (${liveClasses.length}) ---`);
            liveClasses.forEach(l => {
                console.log(`Topic: ${l.topic} | Status: ${l.status} | StartAt: ${l.startAt}`);
            });

        } else {
            console.log('Could not find "Class 10" classroom.');
        }

        mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
};

run();
