import { Platform } from 'react-native';

let RTCPeerConnection: any = null;
let RTCIceCandidate: any = null;
let RTCSessionDescription: any = null;
let RTCView: any = null;
let mediaDevices: any = null;
let MediaStream: any = null;

if (Platform.OS === 'web') {
    RTCPeerConnection = window.RTCPeerConnection || (window as any).webkitRTCPeerConnection;
    RTCIceCandidate = window.RTCIceCandidate;
    RTCSessionDescription = window.RTCSessionDescription;
    RTCView = () => null;
    mediaDevices = navigator.mediaDevices;
    MediaStream = window.MediaStream;
} else {
    try {
        const webrtc = require('react-native-webrtc');
        RTCPeerConnection = webrtc.RTCPeerConnection;
        RTCIceCandidate = webrtc.RTCIceCandidate;
        RTCSessionDescription = webrtc.RTCSessionDescription;
        RTCView = webrtc.RTCView;
        mediaDevices = webrtc.mediaDevices;
        MediaStream = webrtc.MediaStream;
    } catch (e) {
        console.warn('WebRTC is not supported in Expo Go. Please use a development build.');
        mediaDevices = {
            getUserMedia: () => Promise.reject(new Error('WebRTC not available in Expo Go'))
        };
        RTCView = () => null;
    }
}

export {
    RTCPeerConnection,
    RTCIceCandidate,
    RTCSessionDescription,
    RTCView,
    mediaDevices,
    MediaStream,
};
