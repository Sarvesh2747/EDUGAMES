const Quiz = require('../models/Quiz');
const QuizResult = require('../models/QuizResult');
const User = require('../models/User');
const LearnerClassifier = require('../services/learnerClassifier');

// @desc    Get random quiz
// @route   GET /api/quizzes/random
// @access  Public
const getRandomQuiz = async (req, res) => {
    try {
        const count = await Quiz.countDocuments();
        const random = Math.floor(Math.random() * count);
        const quiz = await Quiz.findOne().skip(random);

        if (quiz) {
            res.json(quiz);
        } else {
            res.status(404).json({ message: 'No quizzes found' });
        }
    } catch (error) {
        console.error('Error in getRandomQuiz:', error);
        res.status(500).json({ message: 'Failed to fetch quiz', error: error.message });
    }
};

// @desc    Submit quiz result
// @route   POST /api/quizzes/submit
// @access  Private
const submitQuizResult = async (req, res) => {
    try {
        const { quizId, score, totalQuestions, correctAnswers } = req.body;
        const userId = req.user._id;

        const result = await QuizResult.create({
            userId,
            quizId,
            score,
            totalQuestions,
            correctAnswers
        });

        // Update User XP
        const user = await User.findById(userId);
        if (user) {
            user.xp += score; // Add score to XP
            await user.save();

            // --- LEARNER CLASSIFICATION ---
            try {
                const gameData = {
                    score: score,
                    maxScore: totalQuestions * 10, // Assuming 10 pts per question, or just use a proxy
                    accuracy: (correctAnswers / totalQuestions),
                    duration: totalQuestions * 30, // Estimate 30s per question
                    completedLevel: 1,
                    difficulty: 'medium'
                };
                const userStats = {
                    xp: user.xp,
                    level: user.level,
                    streak: user.streak
                };

                const category = await LearnerClassifier.classify(gameData, userStats);
                if (category && category !== 'neutral') {
                    user.learnerCategory = category;
                    await user.save();
                    console.log(`User ${user.name} classified as ${category} via Quiz`);
                }
            } catch (err) {
                console.error('Classifier error in quiz:', err);
            }
        }

        res.status(201).json(result);
    } catch (error) {
        console.error('Error in submitQuizResult:', error);
        res.status(500).json({ message: 'Failed to submit quiz result', error: error.message });
    }
};

// @desc    Generate Quiz with AI (Mistral)
// @route   POST /api/quizzes/generate-ai
// @access  Private
const axios = require('axios');
const generateQuizAI = async (req, res) => {
    try {
        const { topic, classLevel, difficulty, numQuestions } = req.body;
        const apiKey = process.env.MISTRAL_API_KEY;
        const count = numQuestions || 5;

        const prompt = `Generate ${count} multiple-choice quiz questions about "${topic}" for Class ${classLevel} (${difficulty} difficulty). Return ONLY a raw JSON array (no markdown code blocks) with objects containing: "question", "options" (array of 4 strings), and "correctIndex" (number 0-3). Ensure valid JSON syntax: escape all double quotes inside strings (e.g., \\"example\\").`;

        const response = await axios.post(
            'https://api.mistral.ai/v1/chat/completions',
            {
                model: "mistral-tiny",
                messages: [
                    { role: "system", content: "You are a quiz generation API. Output ONLY valid JSON. Do not use markdown formatting." },
                    { role: "user", content: prompt }
                ],
                response_format: { type: "json_object" }
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                timeout: 60000 // 60 seconds timeout
            }
        );

        let content = response.data.choices[0].message.content;

        // Cleanup: Remove markdown code blocks if present
        content = content.replace(/```json/g, '').replace(/```/g, '').trim();

        const parsed = JSON.parse(content);

        // Handle if wrapper object exists (e.g. { questions: [...] })
        let finalQuestions = Array.isArray(parsed) ? parsed : (parsed.questions || []);

        // Ensure structure matches frontend expectation: { question, options, correctIndex }
        finalQuestions = finalQuestions.map(q => ({
            question: q.question,
            options: q.options,
            correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0 // Fallback if AI messes up
        }));

        res.json(finalQuestions);

    } catch (error) {
        console.error('Quiz Gen Error:', error.response?.data || error.message);
        res.status(500).json({ message: 'Failed to generate quiz' });
    }
};

const QuizQuestion = require('../models/QuizQuestion');

// @desc    Get quiz by topic (class, subject, chapter, subchapter)
// @route   GET /api/quizzes
// @access  Public
const getTopicQuiz = async (req, res) => {
    try {
        const { classNumber, subject, chapter, subchapter } = req.query;
        let questions = [];

        // 1. Try to get questions for specific subchapter
        if (subchapter) {
            questions = await QuizQuestion.find({
                classNumber,
                subject,
                chapter,
                subchapter
            }).limit(15);
        }

        // 2. Fallback to chapter if not enough questions
        if (questions.length < 10) {
            const chapterQuestions = await QuizQuestion.find({
                classNumber,
                subject,
                chapter,
                _id: { $nin: questions.map(q => q._id) } // Exclude already selected
            }).limit(15 - questions.length);

            questions = [...questions, ...chapterQuestions];
        }

        // 3. Fallback to subject if still not enough
        if (questions.length < 10) {
            const subjectQuestions = await QuizQuestion.find({
                classNumber,
                subject,
                _id: { $nin: questions.map(q => q._id) }
            }).limit(15 - questions.length);

            questions = [...questions, ...subjectQuestions];
        }

        // Shuffle questions
        questions = questions.sort(() => Math.random() - 0.5);

        res.json(questions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { getRandomQuiz, submitQuizResult, getTopicQuiz, generateQuizAI };
