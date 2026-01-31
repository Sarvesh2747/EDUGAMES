const User = require('../models/User');
const TeacherQuiz = require('../models/TeacherQuiz');
const Chapter = require('../models/Chapter');
const TeacherChapter = require('../models/TeacherChapter');
const Class = require('../models/Class');
const Subject = require('../models/Subject');

// @desc    Get teacher stats
// @route   GET /api/teacher/stats
// @access  Private/Teacher
const getTeacherStats = async (req, res) => {
    try {
        const teacherId = req.user._id;

        // 1. Total Students assigned to this teacher (or all students if not strictly assigned yet)
        // Adjust query based on your app's "assignment" logic. Assuming teacherId field or class-based logic.
        // For now, let's look for students in classes this teacher teaches? 
        // Or if teacherId is directly on student. The User model has 'teacherId'.

        let studentQuery = { role: 'student' };
        // If your system assigns students directly:
        // studentQuery.teacherId = teacherId; 

        // OR if system is class-based and teacher manages specific classes, you might filter by those classes.
        // Since the prompt implied generic "students", we might need to be careful.
        // But let's try to be specific if possible. If teacherId is not widely used, 
        // maybe we query all students for now if not strictly filtering? 
        // Wait, the User model HAS a teacherId field. Let's try to use it if populated.
        // If not, we might fallback to all students or students in teacher's class?
        // Let's stick to the prompt implication: "My Students".
        // Let's check if we can filter by teacherId. 
        // Ideally: studentQuery.teacherId = teacherId;

        // HOWEVER, simplistic "all students" might be what's currently expected if assignment isn't fully built.
        // Let's check the `getStudents` (line 246) - it returns ALL students.
        // So for consistency, let's count ALL students for now, but arguably filtering is better.
        // Let's try to filter by teacherId OR if the teacher is an "admin" type for their class.
        // Actually, let's stick to ALL students for now to ensure data shows up, 
        // as `teacherId` might not be set on legacy users.

        const totalStudents = await User.countDocuments({ role: 'student' });

        // 2. Pending Approvals
        const pendingApprovals = await User.countDocuments({ role: 'student', status: 'pending' });

        // 3. Average Attendance (Active Today / Total Active Students)
        // Define "Today"
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const activeToday = await User.countDocuments({
            role: 'student',
            lastActiveDate: { $gte: startOfDay }
        });

        const attendancePercentage = totalStudents > 0
            ? Math.round((activeToday / totalStudents) * 100)
            : 0;

        res.json({
            totalStudents,
            pendingApprovals,
            averageAttendance: `${attendancePercentage}%`
        });
    } catch (error) {
        console.error('Error fetching teacher stats:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new quiz
// @route   POST /api/teacher/quiz
// @access  Private/Teacher
const createQuiz = async (req, res) => {
    try {
        const { title, description, classNumber, subject, questions } = req.body;

        const quiz = await TeacherQuiz.create({
            title,
            description,
            teacherId: req.user._id,
            classNumber,
            subject,
            questions
        });

        // Auto-assign to all students in the class
        const students = await User.find({ role: 'student', selectedClass: classNumber });

        const updates = students.map(student => {
            student.assignments.push({
                type: 'quiz',
                quizId: quiz._id,
                assignedAt: new Date(),
                status: 'pending'
            });
            return student.save();
        });

        await Promise.all(updates);

        res.status(201).json(quiz);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Assign quiz to students
// @route   POST /api/teacher/assign-quiz
// @access  Private/Teacher
const assignQuiz = async (req, res) => {
    try {
        const { quizId, studentIds, classNumber } = req.body;

        let query = { role: 'student' };
        if (studentIds && studentIds.length > 0) {
            query._id = { $in: studentIds };
        } else if (classNumber) {
            query.selectedClass = classNumber;
        } else {
            return res.status(400).json({ message: 'Please provide studentIds or classNumber' });
        }

        const students = await User.find(query);

        const updates = students.map(student => {
            // Check if already assigned
            const alreadyAssigned = student.assignments.some(
                a => a.type === 'quiz' && a.quizId && a.quizId.toString() === quizId
            );

            if (!alreadyAssigned) {
                student.assignments.push({
                    type: 'quiz',
                    quizId: quizId,
                    assignedAt: new Date(),
                    status: 'pending'
                });
                return student.save();
            }
        });

        await Promise.all(updates);

        res.json({ message: `Quiz assigned to ${updates.length} students` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Assign chapter to students
// @route   POST /api/teacher/assign-chapter
// @access  Private/Teacher
const assignChapter = async (req, res) => {
    try {
        const { chapterId, studentIds, classNumber } = req.body;

        let query = { role: 'student' };
        if (studentIds && studentIds.length > 0) {
            query._id = { $in: studentIds };
        } else if (classNumber) {
            query.selectedClass = classNumber;
        } else {
            return res.status(400).json({ message: 'Please provide studentIds or classNumber' });
        }

        const students = await User.find(query);

        const updates = students.map(student => {
            // Check if already assigned
            const alreadyAssigned = student.assignments.some(
                a => a.type === 'chapter' && a.chapterId && a.chapterId.toString() === chapterId
            );

            if (!alreadyAssigned) {
                student.assignments.push({
                    type: 'chapter',
                    chapterId: chapterId,
                    assignedAt: new Date(),
                    status: 'pending'
                });
                return student.save();
            }
        });

        await Promise.all(updates);

        res.json({ message: `Chapter assigned to ${updates.length} students` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new custom chapter
// @route   POST /api/teacher/chapter
// @access  Private/Teacher
const createChapter = async (req, res) => {
    try {
        const { title, content, classNumber, subject } = req.body;

        const chapter = await TeacherChapter.create({
            title,
            content,
            teacherId: req.user._id,
            classNumber,
            subject
        });

        // Auto-assign to all students in the class
        const students = await User.find({ role: 'student', selectedClass: classNumber });

        const updates = students.map(student => {
            student.assignments.push({
                type: 'teacherChapter',
                teacherChapterId: chapter._id,
                assignedAt: new Date(),
                status: 'pending'
            });
            return student.save();
        });

        await Promise.all(updates);

        res.status(201).json(chapter);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Assign custom chapter to students
// @route   POST /api/teacher/assign-custom-chapter
// @access  Private/Teacher
const assignCustomChapter = async (req, res) => {
    try {
        const { chapterId, studentIds, classNumber } = req.body;

        let query = { role: 'student' };
        if (studentIds && studentIds.length > 0) {
            query._id = { $in: studentIds };
        } else if (classNumber) {
            query.selectedClass = classNumber;
        } else {
            return res.status(400).json({ message: 'Please provide studentIds or classNumber' });
        }

        const students = await User.find(query);

        const updates = students.map(student => {
            // Check if already assigned
            const alreadyAssigned = student.assignments.some(
                a => a.type === 'teacherChapter' && a.teacherChapterId && a.teacherChapterId.toString() === chapterId
            );

            if (!alreadyAssigned) {
                student.assignments.push({
                    type: 'teacherChapter',
                    teacherChapterId: chapterId,
                    assignedAt: new Date(),
                    status: 'pending'
                });
                return student.save();
            }
        });

        await Promise.all(updates);

        res.json({ message: `Custom chapter assigned to ${updates.length} students` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all content created by teacher
// @route   GET /api/teacher/content
// @access  Private/Teacher
const getMyContent = async (req, res) => {
    try {
        const quizzes = await TeacherQuiz.find({ teacherId: req.user._id }).sort({ createdAt: -1 });
        const chapters = await TeacherChapter.find({ teacherId: req.user._id }).sort({ createdAt: -1 });

        const content = [
            ...quizzes.map(q => ({ ...q.toObject(), type: 'quiz' })),
            ...chapters.map(c => ({ ...c.toObject(), type: 'teacherChapter' }))
        ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json(content);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all students
// @route   GET /api/teacher/students
// @access  Private/Teacher
const getStudents = async (req, res) => {
    try {
        // Filter students assigned to this teacher
        const students = await User.find({
            role: 'student',
            teacherId: req.user._id // Only get students assigned to this teacher
        }).select('-password').sort({ createdAt: -1 });

        res.json(students);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a quiz
// @route   DELETE /api/teacher/quiz/:id
// @access  Private/Teacher
const deleteQuiz = async (req, res) => {
    try {
        const quiz = await TeacherQuiz.findById(req.params.id);

        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        if (quiz.teacherId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await quiz.deleteOne();
        res.json({ message: 'Quiz removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a chapter
// @route   DELETE /api/teacher/chapter/:id
// @access  Private/Teacher
const deleteChapter = async (req, res) => {
    try {
        const chapter = await TeacherChapter.findById(req.params.id);

        if (!chapter) {
            return res.status(404).json({ message: 'Chapter not found' });
        }

        if (chapter.teacherId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await chapter.deleteOne();
        res.json({ message: 'Chapter removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a quiz
// @route   PUT /api/teacher/quiz/:id
// @access  Private/Teacher
const updateQuiz = async (req, res) => {
    try {
        const { title, description, classNumber, subject, questions } = req.body;
        const quiz = await TeacherQuiz.findById(req.params.id);

        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        if (quiz.teacherId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        quiz.title = title || quiz.title;
        quiz.description = description || quiz.description;
        quiz.classNumber = classNumber || quiz.classNumber;
        quiz.subject = subject || quiz.subject;
        quiz.questions = questions || quiz.questions;

        const updatedQuiz = await quiz.save();
        res.json(updatedQuiz);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new student
// @route   POST /api/teacher/student
// @access  Private/Teacher
const createStudent = async (req, res) => {
    try {
        const { name, email, password, grade } = req.body;

        // Validation
        if (!name || !email || !password || !grade) {
            return res.status(400).json({ message: 'Please provide all fields' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        // Validate grade
        const selectedClass = parseInt(grade);
        if (isNaN(selectedClass) || selectedClass < 6 || selectedClass > 12) {
            return res.status(400).json({ message: 'Grade must be between 6 and 12' });
        }

        // Create student with automatic teacher assignment
        const student = await User.create({
            name,
            email,
            password, // Will be hashed by pre-save hook
            role: 'student',
            selectedClass,
            teacherId: req.user._id, // Auto-assign to creating teacher
            status: 'active', // Automatically active since created by teacher
        });

        res.status(201).json({
            _id: student._id,
            name: student.name,
            email: student.email,
            role: student.role,
            selectedClass: student.selectedClass,
            teacherId: student.teacherId,
            status: student.status,
        });
    } catch (error) {
        console.error('Error creating student:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all syllabus chapters for a class
// @route   GET /api/teacher/chapters
// @access  Private/Teacher
const getAllChapters = async (req, res) => {
    try {
        const classNumber = parseInt(req.query.class);
        if (!classNumber) {
            return res.status(400).json({ message: 'Class number is required' });
        }

        const classDoc = await Class.findOne({ classNumber });
        if (!classDoc) {
            return res.status(404).json({ message: 'Class not found' });
        }

        const subjects = await Subject.find({ classId: classDoc._id });
        const subjectIds = subjects.map(s => s._id);

        const chapters = await Chapter.find({ subjectId: { $in: subjectIds } })
            .populate('subjectId', 'name');

        // Transform for frontend
        const formattedChapters = chapters.map(ch => ({
            _id: ch._id,
            title: ch.name,
            subject: ch.subjectId.name,
            index: ch.index
        }));

        res.json(formattedChapters);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get students by class
// @route   GET /api/teacher/students/class/:classNumber
// @access  Private/Teacher
const getStudentsByClass = async (req, res) => {
    try {
        const classNumber = parseInt(req.params.classNumber);
        if (!classNumber) {
            return res.status(400).json({ message: 'Invalid class number' });
        }

        const students = await User.find({
            role: 'student',
            selectedClass: classNumber
        })
            .select('_id name email selectedClass')
            .sort({ name: 1 });

        res.json(students);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a student
// @route   DELETE /api/teacher/student/:id
// @access  Private/Teacher
const deleteStudent = async (req, res) => {
    try {
        const student = await User.findById(req.params.id);

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Ensure student belongs to this teacher
        if (student.teacherId && student.teacherId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to delete this student' });
        }

        await student.deleteOne();
        res.json({ message: 'Student removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a student
// @route   PUT /api/teacher/student/:id
// @access  Private/Teacher
const updateStudent = async (req, res) => {
    try {
        const { name, rollNo, status } = req.body;
        const student = await User.findById(req.params.id);

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Ensure student belongs to this teacher
        if (student.teacherId && student.teacherId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to update this student' });
        }

        student.name = name || student.name;
        student.rollNo = rollNo || student.rollNo;

        // Only update status if provided
        if (status) {
            student.status = status;
        }

        const updatedStudent = await student.save();
        res.json(updatedStudent);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getTeacherStats,
    createQuiz,
    assignQuiz,
    assignChapter,
    createChapter,
    assignCustomChapter,
    getMyContent,
    getStudents,
    createStudent,
    deleteQuiz,
    deleteChapter,
    updateQuiz,
    getAllChapters,
    getStudentsByClass,
    deleteStudent,
    updateStudent // New
};
