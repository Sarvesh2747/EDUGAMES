const LiveClass = require('../models/LiveClass');
const Class = require('../models/Class');
const Subject = require('../models/Subject');

/**
 * @desc    Schedule a new live class
 * @route   POST /api/live-classes/schedule
 * @access  Private (Teacher)
 */
const scheduleClass = async (req, res) => {
    try {
        const { classId, subject, topic, startAt, duration } = req.body;
        console.log('DEBUG: Schedule Request Body:', req.body);

        // 1. Basic Validation
        if (!classId || !subject || !topic || !startAt || !duration) {
            console.log('DEBUG: Missing Fields');
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        // 2. Validate Start Time (Must be in future)
        const startTimeDates = new Date(startAt);
        const now = new Date();
        console.log(`DEBUG: Time Check - Start: ${startTimeDates.toISOString()}, Now: ${now.toISOString()}`);

        // Allow 1 minute grace period for network latency
        if (startTimeDates < new Date(now.getTime() - 60000)) {
            console.log('DEBUG: Date is in the past');
            return res.status(400).json({ message: 'Class time must be in the future' });
        }

        // 3. Check for Overlap (Teacher's schedule)
        // Logic: NewStart < ExistingEnd AND NewEnd > ExistingStart
        const newEndAt = new Date(startTimeDates.getTime() + duration * 60000);

        const conflict = await LiveClass.findOne({
            teacherId: req.user._id,
            status: { $in: ['scheduled', 'live'] },
            startAt: { $lt: newEndAt },
            $expr: {
                $gt: [
                    { $add: ['$startAt', { $multiply: ['$duration', 60000] }] },
                    startTimeDates
                ]
            }
        });

        if (conflict) {
            return res.status(409).json({
                message: 'You already have a class scheduled during this time slot.',
                conflict: {
                    topic: conflict.topic,
                    startAt: conflict.startAt,
                    duration: conflict.duration
                }
            });
        }

        // 4. Generate Deterministic Room ID
        // Format: ClassID_Subject_StartTimeEpoch (Sanitize subject for spaces)
        const sanitizedSubject = subject.replace(/\s+/g, '_');
        const roomId = `${classId}_${sanitizedSubject}_${startTimeDates.getTime()}`;

        // 5. Create Live Class
        const liveClass = await LiveClass.create({
            classId,
            subject,
            teacherId: req.user._id,
            topic,
            startAt: startTimeDates,
            duration,
            roomId,
            status: 'scheduled'
        });

        res.status(201).json(liveClass);

    } catch (error) {
        console.error('Error scheduling class:', error);
        // Handle duplicate key error (if somehow roomId collides, though highly unlikely with timestamp)
        if (error.code === 11000) {
            return res.status(400).json({ message: 'A class with this exact configuration already exists.' });
        }
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

/**
 * @desc    Get live classes for a specific classroom
 * @route   GET /api/live-classes/classroom/:classId
 * @access  Private
 */
const getLiveClasses = async (req, res) => {
    try {
        const { classId } = req.params;

        const classes = await LiveClass.find({ classId })
            .populate('teacherId', 'name avatar')
            .sort({ startAt: 1 }); // Ascending order (soonest first)

        res.json(classes);
    } catch (error) {
        console.error('Error fetching live classes:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { scheduleClass, getLiveClasses };
