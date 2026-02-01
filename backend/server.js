const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api/learn', require('./routes/learn'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/institute', require('./routes/instituteRoutes'));
app.use('/api/teacher', require('./routes/teacherRoutes'));
app.use('/api/lessons', require('./routes/lessons'));
app.use('/api/quizzes', require('./routes/quizzes'));
app.use('/api/games', require('./routes/games'));
app.use('/api/science', require('./routes/science'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/sync', require('./routes/sync'));
app.use('/api/xp', require('./routes/xpRoutes'));
app.use('/api/streak', require('./routes/streakRoutes'));
app.use('/api/progress', require('./routes/progress'));
app.use('/api/approval', require('./routes/approval'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/student', require('./routes/studentRoutes'));
app.use('/api/videos', require('./routes/videoRoutes'));
app.use('/api/wellbeing', require('./routes/wellbeingRoutes'));
app.use('/api/feedback', require('./routes/feedbackRoutes'));
<<<<<<< Updated upstream
app.use('/api/live-classes', require('./routes/liveClassRoutes'));
=======
app.use('/api/notebook', require('./routes/notebookRoutes'));
>>>>>>> Stashed changes

// Health check route
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Backend is running' });
});

// Base route
app.get('/', (req, res) => {
    res.send('Rural Learning App API is running');
});

// Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Initialize Server & Socket.io
const server = require('http').createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Attach Socket Handler
require('./socket/socketHandler')(io);

server.listen(PORT, '0.0.0.0', () => {
    console.log('\n\x1b[35m╔════════════════════════════════════════════════════════════╗\x1b[0m');
    console.log('\x1b[35m║\x1b[0m                                                            \x1b[35m║\x1b[0m');
    console.log('\x1b[35m║\x1b[0m  \x1b[1m\x1b[36m🚀  CoreTechLabs Backend Server\x1b[0m                        \x1b[35m║\x1b[0m');
    console.log('\x1b[35m║\x1b[0m  \x1b[2m\x1b[37m    Educational Gaming Platform API\x1b[0m                    \x1b[35m║\x1b[0m');
    console.log('\x1b[35m║\x1b[0m                                                            \x1b[35m║\x1b[0m');
    console.log('\x1b[35m╠════════════════════════════════════════════════════════════╣\x1b[0m');
    console.log('\x1b[35m║\x1b[0m                                                            \x1b[35m║\x1b[0m');
    console.log(`\x1b[35m║\x1b[0m  \x1b[33m📍 Environment:\x1b[0m  \x1b[32m${(process.env.NODE_ENV || 'development').padEnd(37)}\x1b[0m\x1b[35m║\x1b[0m`);
    console.log(`\x1b[35m║\x1b[0m  \x1b[33m🌐 Port:\x1b[0m         \x1b[32m${String(PORT).padEnd(37)}\x1b[0m\x1b[35m║\x1b[0m`);
    console.log('\x1b[35m║\x1b[0m                                                            \x1b[35m║\x1b[0m');
    console.log(`\x1b[35m║\x1b[0m  \x1b[36m🔗 Local:\x1b[0m        \x1b[4m\x1b[34mhttp://localhost:${PORT}\x1b[0m${' '.repeat(37 - String(PORT).length - 16)}\x1b[35m║\x1b[0m`);
    console.log(`\x1b[35m║\x1b[0m  \x1b[36m🌍 Network:\x1b[0m      \x1b[4m\x1b[34mhttp://192.168.1.7:${PORT}\x1b[0m${' '.repeat(37 - String(PORT).length - 19)}\x1b[35m║\x1b[0m`);
    console.log('\x1b[35m║\x1b[0m                                                            \x1b[35m║\x1b[0m');
    console.log('\x1b[35m╠════════════════════════════════════════════════════════════╣\x1b[0m');
    console.log('\x1b[35m║\x1b[0m                                                            \x1b[35m║\x1b[0m');
    console.log('\x1b[35m║\x1b[0m  \x1b[1m\x1b[32m✨ Server is ready to handle requests!\x1b[0m                \x1b[35m║\x1b[0m');
    console.log('\x1b[35m║\x1b[0m  \x1b[2m\x1b[90m   Press Ctrl+C to stop the server\x1b[0m                    \x1b[35m║\x1b[0m');
    console.log('\x1b[35m║\x1b[0m                                                            \x1b[35m║\x1b[0m');
    console.log('\x1b[35m╚════════════════════════════════════════════════════════════╝\x1b[0m\n');
});
