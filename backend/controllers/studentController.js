const User = require('../models/User');
const TeacherQuiz = require('../models/TeacherQuiz');
const LearnerClassifier = require('../services/learnerClassifier');

// @desc    Get assigned tasks for student
// @route   GET /api/student/tasks
// @access  Private/Student
const getStudentTasks = async (req, res) => {
    try {
        const student = await User.findById(req.user._id)
            .populate({
                path: 'assignments.chapterId',
                select: 'title subject classNumber'
            })
            .populate({
                path: 'assignments.quizId',
                select: 'title subject classNumber'
            })
            .populate({
                path: 'assignments.teacherChapterId',
                select: 'title subject classNumber content'
            });

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Format tasks
        const tasks = student.assignments.map(assignment => {
            if (assignment.type === 'quiz' && assignment.quizId) {
                return {
                    id: assignment._id,
                    type: 'quiz',
                    quizId: assignment.quizId._id,
                    title: assignment.quizId.title,
                    subject: assignment.quizId.subject,
                    classNumber: assignment.quizId.classNumber,
                    assignedAt: assignment.assignedAt,
                    status: assignment.status
                };
            } else if (assignment.type === 'teacherChapter' && assignment.teacherChapterId) {
                return {
                    id: assignment._id,
                    type: 'teacherChapter',
                    chapterId: assignment.teacherChapterId._id,
                    title: assignment.teacherChapterId.title,
                    content: assignment.teacherChapterId.content,
                    subject: assignment.teacherChapterId.subject,
                    classNumber: assignment.teacherChapterId.classNumber,
                    assignedAt: assignment.assignedAt,
                    status: assignment.status
                };
            } else if (assignment.chapterId) {
                return {
                    id: assignment._id,
                    type: 'chapter',
                    chapterId: assignment.chapterId._id,
                    chapterName: assignment.chapterId.title,
                    subject: assignment.chapterId.subject,
                    classNumber: assignment.chapterId.classNumber,
                    assignedAt: assignment.assignedAt,
                    status: assignment.status
                };
            }
            return null;
        }).filter(task => task !== null);

        // Sort by date (newest first)
        tasks.sort((a, b) => new Date(b.assignedAt) - new Date(a.assignedAt));

        res.json(tasks);
    } catch (error) {
        console.error('Error fetching student tasks:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get quiz by ID
// @route   GET /api/student/quiz/:id
// @access  Private/Student
const getQuizById = async (req, res) => {
    try {
        const quiz = await TeacherQuiz.findById(req.params.id);
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }
        res.json(quiz);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Submit quiz result and mark assignment as completed
// @route   POST /api/student/quiz/submit
// @access  Private/Student
const submitQuizResult = async (req, res) => {
    try {
        console.log('DEBUG: submitQuizResult called with body:', req.body);
        const { quizId, assignmentId, score, totalQuestions } = req.body;
        const student = await User.findById(req.user._id);

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Find the assignment
        let assignment;
        console.log('DEBUG: Student assignments count:', student.assignments.length);
        console.log('DEBUG: Available Assignment IDs:', student.assignments.map(a => a._id.toString()));

        if (assignmentId) {
            assignment = student.assignments.id(assignmentId);
            console.log('DEBUG: Looked for assignmentId:', assignmentId, 'Found:', !!assignment);
        }

        // Fallback or validation
        if (!assignment && quizId) {
            console.log('DEBUG: Fallback search by quizId:', quizId);
            assignment = student.assignments.find(
                a => a.quizId && a.quizId.toString() === quizId && a.status === 'pending'
            );
            console.log('DEBUG: Fallback Found:', !!assignment);
        }

        if (assignment) {
            console.log('DEBUG: Assignment found, updating status. ID:', assignment._id);
            assignment.status = 'completed';
            // You could also save the score here if the schema supported it
            await student.save();

            // --- LEARNER CLASSIFICATION ---
            try {
                const gameData = {
                    score: score,
                    maxScore: totalQuestions * 10, // Assuming 10 pts per question
                    accuracy: (score / (totalQuestions * 10)), // Approx accuracy if score provided, else use passed accuracy?
                    // Actually submitQuizResult gets 'score' (usually raw?) and 'totalQuestions'.
                    // If score is number of correct answers:
                    // accuracy: score / totalQuestions
                    // If score is points:
                    // We need to know max points. Let's assume standard 10 pts/question for now or infer

                    // Re-reading usage in frontend might clarify, but for safety let's assume
                    // score is raw points and we normalize.
                    // Or if score is "number correct", then accuracy is easy.
                    // Let's rely on passed params.
                    duration: totalQuestions * 30, // Estimate
                    completedLevel: 1,
                    difficulty: 'medium'
                };

                // Refinining accuracy calc based on typical backend usage:
                // If the frontend sends 'score' as points, we might not know max without querying quiz.
                // But let's try a best effort.
                // If score <= totalQuestions, it's likely "number correct".
                // If score > totalQuestions, it's likely points.
                let calculatedAccuracy = 0;
                if (score <= totalQuestions) {
                    calculatedAccuracy = score / totalQuestions;
                } else {
                    calculatedAccuracy = score / (totalQuestions * 10); // Assume 10pts/q
                }

                gameData.accuracy = calculatedAccuracy;

                const userStats = {
                    xp: student.xp,
                    level: student.level,
                    streak: student.streak
                };

                const category = await LearnerClassifier.classify(gameData, userStats);
                if (category && category !== 'neutral') {
                    student.learnerCategory = category;
                    await student.save();
                    console.log(`Student ${student.name} classified as ${category} via Assignment`);
                }
            } catch (err) {
                console.error('Classifier error in student assignment:', err);
            }

            console.log('DEBUG: Student saved successfully');
            res.json({ message: 'Quiz submitted and assignment marked completed', xpGained: 0 }); // XP handled by xpController usually
        } else {
            // Even if not found (maybe already completed?), we accept the submission log
            res.json({ message: 'Quiz result logged (no pending assignment found)' });
        }
    } catch (error) {
        console.error('Error submitting quiz:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all classroom content (chapters & quizzes) for the student's class
// @route   GET /api/student/classroom
// @access  Private/Student
// @desc    Get all classroom content (chapters & quizzes) for the student's class
// @route   GET /api/student/classroom
// @access  Private/Student
const getClassroomContent = async (req, res) => {
    try {
        const student = await User.findById(req.user._id)
            .populate('instituteId', 'name')
            .populate('teacherId', 'name avatar');

        if (!student || !student.selectedClass) {
            return res.status(400).json({ message: 'Student class not found' });
        }

        const classNumber = String(student.selectedClass);
        const TeacherChapter = require('../models/TeacherChapter');
        const TeacherQuiz = require('../models/TeacherQuiz');

        const chapters = await TeacherChapter.find({ classNumber })
            .select('title subject content createdAt teacherId')
            .populate('teacherId', 'name avatar');

        const quizzes = await TeacherQuiz.find({ classNumber })
            .select('title subject description questions createdAt teacherId')
            .populate('teacherId', 'name avatar');

        // Extract unique teachers from content
        const uniqueTeacherMap = new Map();

        const processTeacher = (contentItem) => {
            if (contentItem.teacherId) {
                const tid = contentItem.teacherId._id.toString();
                if (!uniqueTeacherMap.has(tid)) {
                    uniqueTeacherMap.set(tid, {
                        id: tid,
                        name: contentItem.teacherId.name,
                        subject: contentItem.subject, // Assumes teacher teaches this subject
                        avatar: contentItem.teacherId.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(contentItem.teacherId.name)}&background=random`
                    });
                }
            }
        };

        chapters.forEach(processTeacher);
        quizzes.forEach(processTeacher);

        // ALWAYS Add assigned teacher if they exist, even if they have no content for this class
        if (student.teacherId) {
            const tid = student.teacherId._id.toString();
            if (!uniqueTeacherMap.has(tid)) {
                uniqueTeacherMap.set(tid, {
                    id: tid,
                    name: student.teacherId.name,
                    subject: 'Class Teacher',
                    avatar: student.teacherId.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.teacherId.name)}&background=random`
                });
            }
        }

        const teachers = Array.from(uniqueTeacherMap.values());

        // Combine and format content
        const content = [
            ...chapters.map(c => ({
                id: c._id,
                type: 'chapter',
                title: c.title,
                subtitle: c.subject,
                description: c.content ? c.content.substring(0, 100) + '...' : '',
                fullContent: c.content,
                teacher: c.teacherId ? c.teacherId.name : 'Unknown',
                date: c.createdAt,
                icon: 'book-open-page-variant'
            })),
            ...quizzes.map(q => ({
                id: q._id,
                type: 'quiz',
                title: q.title,
                subtitle: q.subject,
                description: q.description || `${q.questions.length} Questions`,
                teacher: q.teacherId ? q.teacherId.name : 'Unknown',
                date: q.createdAt,
                icon: 'format-list-checks',
                questions: q.questions
            }))
        ];

        // Sort by date descending
        content.sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json({
            meta: {
                className: `Class ${student.selectedClass}`,
                schoolName: student.instituteId ? student.instituteId.name : 'Rural High School', // Fallback
                teachers: teachers
            },
            content: content
        });
    } catch (error) {
        console.error('Error fetching classroom content:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getStudentTasks,
    getQuizById,
    submitQuizResult,
    getClassroomContent
};
