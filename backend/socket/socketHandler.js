const jwt = require('jsonwebtoken');

const socketHandler = (io) => {
    // Middleware for authentication
    io.use((socket, next) => {
        if (socket.handshake.query && socket.handshake.query.token) {
            jwt.verify(socket.handshake.query.token, process.env.JWT_SECRET, (err, decoded) => {
                if (err) return next(new Error('Authentication error'));
                socket.user = decoded;
                next();
            });
        } else {
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.id}, User: ${socket.user?.id}`);

        // Join a specific class room
        socket.on('join-room', (roomId) => {
            socket.join(roomId);
            console.log(`User ${socket.user?.id} joined room: ${roomId}`);
            // Notify others in room
            socket.to(roomId).emit('user-connected', socket.user?.id);
        });

        // WebRTC Signaling Events
        socket.on('offer', (data) => {
            socket.to(data.roomId).emit('offer', data);
        });

        socket.on('answer', (data) => {
            socket.to(data.roomId).emit('answer', data);
        });

        socket.on('ice-candidate', (data) => {
            socket.to(data.roomId).emit('ice-candidate', data);
        });

        socket.on('screen-share-started', (roomId) => {
            socket.to(roomId).emit('user-started-screen-share', socket.user?.id);
        });

        socket.on('screen-share-stopped', (roomId) => {
            socket.to(roomId).emit('user-stopped-screen-share', socket.user?.id);
        });

        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });
};

module.exports = socketHandler;
