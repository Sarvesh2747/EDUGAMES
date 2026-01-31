const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const seedAdmin = require('./seed/admin');
const seedContent = require('./seed/content');
const seedStatic = require('./seed/static');
const seedBasicStudents = require('./seed/students-basic');
const seedDemoStudents = require('./seed/students-demo');
const seedClasses = require('./seed/classes');
const restoreUser = require('./seed/restore-user');

// Handle arguments
const args = process.argv.slice(2);
const runAll = args.includes('--all') || args.length === 0;

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/edugames');
        console.log('✓ MongoDB Connected');
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error.message);
        process.exit(1);
    }
};

const runSeed = async () => {
    await connectDB();
    console.log('\n🌱 STARTING DATABASE SEEDING\n');

    try {
        await seedAdmin();
        await seedClasses(); // Ensure classes 6-12 exist
        await seedStatic();
        await seedContent();

        // Student seeding - these might clear each other if not careful, 
        // but our modules are designed to clear specific scope or subsets.
        // seedBasicStudents clears non-demo students.
        // seedDemoStudents clears demo students.
        // So running both is safe and results in Mixed population.

        await seedBasicStudents();
        await seedDemoStudents();
        await restoreUser();

        console.log('\n🎉 ALL SEEDING COMPLETED SUCCESSFULLY!\n');
    } catch (error) {
        console.error('\n❌ SEEDING FAILED:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('✓ Database connection closed');
        process.exit(0);
    }
};

runSeed();
