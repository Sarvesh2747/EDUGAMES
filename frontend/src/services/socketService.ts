import io, { Socket } from 'socket.io-client';
import api from './api';

const SOCKET_URL = 'http://192.168.1.7:5000'; // Or generic localhost if needed

class SocketService {
    socket: Socket | null = null;

    connect(token: string) {
        this.socket = io(SOCKET_URL, {
            query: { token },
            transports: ['websocket'],
            forceNew: true,
        });

        this.socket.on('connect', () => {
            console.log('Socket Connected:', this.socket?.id);
        });

        this.socket.on('connect_error', (err) => {
            console.error('Socket Connection Error:', err);
        });
    }

    joinRoom(roomId: string) {
        if (this.socket) {
            this.socket.emit('join-room', roomId);
        }
    }

    // WebRTC Signaling Wrappers
    sendOffer(data: any) { this.socket?.emit('offer', data); }
    sendAnswer(data: any) { this.socket?.emit('answer', data); }
    sendIceCandidate(data: any) { this.socket?.emit('ice-candidate', data); }

    startScreenShare(roomId: string) { this.socket?.emit('screen-share-started', roomId); }
    stopScreenShare(roomId: string) { this.socket?.emit('screen-share-stopped', roomId); }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}

export default new SocketService();
