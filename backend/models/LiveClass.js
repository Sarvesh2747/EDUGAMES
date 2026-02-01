const mongoose = require('mongoose');

const LiveClassSchema = new mongoose.Schema({
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Classroom',
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    topic: {
        type: String,
        required: true,
        trim: true
    },
    startAt: {
        type: Date,
        required: true
    },
    duration: {
        type: Number, // minutes
        required: true,
        min: 10
    },
    status: {
        type: String,
        enum: ['scheduled', 'live', 'completed', 'cancelled'],
        default: 'scheduled'
    },
    roomId: {
        type: String,
        unique: true,
        index: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('LiveClass', LiveClassSchema);
