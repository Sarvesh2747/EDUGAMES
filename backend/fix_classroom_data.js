require('dotenv').config();
const mongoose = require('mongoose');

// Use empty schema with strict: false to update RAW data
const Classroom = mongoose.model('Classroom', new mongoose.Schema({}, { strict: false }));

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log('\n--- FORCE CORRECTING CLASSROOM DATA ---');
        // Find by ID directly to be safe (ID from previous log)
        const targetId = '697e561a07737caa5c95b93a';

        console.log(`Targeting Classroom ID: ${targetId}`);

        const result = await Classroom.updateOne(
            { _id: targetId },
            { $set: { classNumber: 10 } }
        );

        console.log('Update Result:', result);

        // Verify immediately
        const cls = await Classroom.findById(targetId);
        console.log(`VERIFICATION: New classNumber is: ${cls.classNumber} (Type: ${typeof cls.classNumber})`);

        mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
};

run();
