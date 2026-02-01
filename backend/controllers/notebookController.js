const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const NotebookContent = require('../models/NotebookContent');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Ensure upload directory exists
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
(async () => {
    try {
        await fs.mkdir(UPLOAD_DIR, { recursive: true });
    } catch (err) {
        console.error('Failed to create uploads directory:', err);
    }
})();

// Configure Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword',
            'text/plain',
            'text/markdown'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'), false);
        }
    }
}).single('file');

// Helper: Extract Text
const extractText = async (filePath, mimeType) => {
    try {
        if (mimeType === 'application/pdf') {
            const dataBuffer = await fs.readFile(filePath);
            const data = await pdf(dataBuffer);
            return data.text;
        }
        if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || mimeType === 'application/msword') {
            const result = await mammoth.extractRawText({ path: filePath });
            return result.value;
        }
        if (mimeType === 'text/plain' || mimeType === 'text/markdown') {
            return await fs.readFile(filePath, 'utf-8');
        }
        return '';
    } catch (error) {
        console.error('Text extraction failed:', error);
        return '';
    }
};

// @desc    Upload Document
// @route   POST /api/notebook/upload
// @access  Private
const uploadDocument = async (req, res) => {
    upload(req, res, async (err) => {
        if (err) return res.status(400).json({ message: err.message });
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        try {
            const text = await extractText(req.file.path, req.file.mimetype);
            const wordCount = text.split(/\s+/).filter(Boolean).length;

            const content = await NotebookContent.create({
                user: req.user._id,
                title: req.body.title || req.file.originalname,
                type: 'document',
                originalFilename: req.file.originalname,
                mimeType: req.file.mimetype,
                fileSize: req.file.size,
                filePath: req.file.path,
                extractedText: text,
                wordCount,
                status: 'uploaded'
            });

            // Automatically trigger analysis if text exists
            if (text && text.length > 50) {
                // We'll call analyze asynchronously or let user trigger it
                // For now, let's keep it manual trigger to match UI flow, or auto start
            }

            res.status(201).json(content);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Upload failed' });
        }
    });
};

// @desc    Get All Documents
// @route   GET /api/notebook
// @access  Private
const getDocuments = async (req, res) => {
    try {
        const docs = await NotebookContent.find({ user: req.user._id })
            .select('-extractedText -flashcards -quiz') // Exclude heavy fields for list
            .sort({ createdAt: -1 });
        res.json(docs);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch documents' });
    }
};

// @desc    Get Single Document
// @route   GET /api/notebook/:id
// @access  Private
const getDocumentById = async (req, res) => {
    try {
        const doc = await NotebookContent.findOne({ _id: req.params.id, user: req.user._id });
        if (!doc) return res.status(404).json({ message: 'Document not found' });
        res.json(doc);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Analyze Document (Gemini)
// @route   POST /api/notebook/:id/analyze
// @access  Private
const analyzeDocument = async (req, res) => {
    try {
        const doc = await NotebookContent.findOne({ _id: req.params.id, user: req.user._id });
        if (!doc) return res.status(404).json({ message: 'Document not found' });
        if (!doc.extractedText) return res.status(400).json({ message: 'No text content' });

        doc.status = 'processing';
        await doc.save();

        const prompt = `
        You are an expert educational content analyzer. Analyze the following text and transform it into clear study notes.
        Return ONLY a JSON object with this structure:
        {
            "executive": "2-3 sentence summary",
            "keyPoints": ["point 1", "point 2"],
            "detailedAnalysis": "Full study notes content in Markdown",
            "topics": ["topic1", "topic2"]
        }
        
        Text to analyze:
        ${doc.extractedText.substring(0, 30000)}
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Clean markdown code blocks if present
        const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const analysis = JSON.parse(jsonStr);

        doc.summary = analysis;
        doc.status = 'analyzed';
        await doc.save();

        res.json(doc);
    } catch (error) {
        console.error('Analysis failed:', error);

        // Restore status if failed
        if (req.params.id) {
            await NotebookContent.findByIdAndUpdate(req.params.id, {
                status: 'error',
                errorMessage: error.message
            });
        }

        res.status(500).json({ message: 'Analysis failed' });
    }
};

// @desc    Generate Flashcards
// @route   POST /api/notebook/:id/flashcards
// @access  Private
const generateFlashcards = async (req, res) => {
    try {
        const doc = await NotebookContent.findOne({ _id: req.params.id, user: req.user._id });
        if (!doc) return res.status(404).json({ message: 'Document not found' });

        const prompt = `
        Generate 10 educational flashcards from the text.
        Return ONLY a JSON array of objects:
        [
            { "question": "...", "answer": "...", "difficulty": "easy|medium|hard", "topic": "..." }
        ]
        
        Text:
        ${doc.extractedText.substring(0, 30000)}
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const flashcards = JSON.parse(jsonStr);

        doc.flashcards = flashcards;
        doc.status = 'flashcards_generated';
        await doc.save();

        res.json(doc.flashcards);
    } catch (error) {
        console.error('Flashcard generation failed:', error);
        res.status(500).json({ message: 'Failed to generate flashcards' });
    }
};

// @desc    Generate Quiz
// @route   POST /api/notebook/:id/quiz
// @access  Private
const generateQuiz = async (req, res) => {
    try {
        const doc = await NotebookContent.findOne({ _id: req.params.id, user: req.user._id });
        if (!doc) return res.status(404).json({ message: 'Document not found' });

        const prompt = `
        Generate 10 multiple-choice quiz questions from the text.
        Return ONLY a JSON array of objects:
        [
            { 
                "question": "...", 
                "options": ["A", "B", "C", "D"], 
                "correctAnswer": 0, 
                "explanation": "...", 
                "difficulty": "medium",
                "topic": "..."
            }
        ]
        
        Text:
        ${doc.extractedText.substring(0, 30000)}
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const quiz = JSON.parse(jsonStr);

        doc.quiz = quiz;
        doc.status = 'quiz_generated';
        await doc.save();

        res.json(doc.quiz);
    } catch (error) {
        console.error('Quiz generation failed:', error);
        res.status(500).json({ message: 'Failed to generate quiz' });
    }
};

// @desc    Delete Content
// @route   DELETE /api/notebook/:id
// @access  Private
const deleteContent = async (req, res) => {
    try {
        const doc = await NotebookContent.findOneAndDelete({ _id: req.params.id, user: req.user._id });
        if (!doc) return res.status(404).json({ message: 'Document not found' });

        // Try to delete physical file
        if (doc.filePath) {
            try {
                await fs.unlink(doc.filePath);
            } catch (e) {
                console.warn('File not found for deletion:', doc.filePath);
            }
        }

        res.json({ message: 'Deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Delete failed' });
    }
};

module.exports = {
    uploadDocument,
    getDocuments,
    getDocumentById,
    analyzeDocument,
    generateFlashcards,
    generateQuiz,
    deleteContent
};
