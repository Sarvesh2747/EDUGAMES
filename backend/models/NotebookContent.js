const mongoose = require('mongoose');

const flashcardSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true,
    },
    answer: {
        type: String,
        required: true,
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium',
    },
    topic: String,
    sourceReference: String,
    known: {
        type: Boolean,
        default: false,
    },
    reviewCount: {
        type: Number,
        default: 0,
    },
    lastReviewed: Date,
    nextReviewDate: Date,
});

const quizQuestionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true,
    },
    options: [{
        type: String,
    }],
    correctAnswer: {
        type: Number, // index of correct option
        required: true,
    },
    explanation: String,
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium',
    },
    topic: String,
});

const summarySchema = new mongoose.Schema({
    executive: String,
    keyPoints: [String],
    detailedAnalysis: String,
    entities: [{
        name: String,
        type: String, // person, date, location, term
    }],
    topics: [String],
    processingTime: Number,
    confidence: Number,
});

const notebookContentSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: ['document', 'audio', 'video', 'url', 'youtube'],
            required: true,
        },
        originalFilename: String,
        mimeType: String,
        fileSize: Number,
        filePath: String,
        sourceUrl: String,
        extractedText: {
            type: String,
            default: '',
        },
        wordCount: {
            type: Number,
            default: 0,
        },
        summary: summarySchema,
        flashcards: [flashcardSchema],
        quiz: [quizQuestionSchema],
        status: {
            type: String,
            enum: ['uploaded', 'processing', 'analyzed', 'flashcards_generated', 'quiz_generated', 'error'],
            default: 'uploaded',
        },
        errorMessage: String,
        tags: [String],
        isFavorite: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

notebookContentSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('NotebookContent', notebookContentSchema);
