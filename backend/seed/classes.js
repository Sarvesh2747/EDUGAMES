const Class = require('../models/Class');

const seedClasses = async () => {
    const classes = [6, 7, 8, 9, 10, 11, 12];

    console.log('   🏫 Seeding Classes...');

    for (const classNum of classes) {
        let classDoc = await Class.findOne({ classNumber: classNum });
        if (!classDoc) {
            await Class.create({ classNumber: classNum });
            console.log(`      ✓ Created Class ${classNum}`);
        }
    }
    console.log('      ✓ Classes seeded check complete');
};

module.exports = seedClasses;
