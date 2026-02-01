require('dotenv').config();
const mongoose = require('mongoose');

const Classroom = mongoose.model('Classroom', new mongoose.Schema({}, { strict: false }));

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log('\n--- LISTING ALL CLASSROOMS ---');
        const all = await Classroom.find({});

        all.forEach(c => {
            console.log(`ID: ${c._id}`);
            console.log(`   Title: "${c.title}"`);
            console.log(`   Subject: "${c.subject}"`);
            console.log(`   ClassNumber: ${c.classNumber}`);
            console.log(`   Students Count: ${c.students ? c.students.length : 0}`);
            console.log('-----------------------------------');
        });

        mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
};

run();
