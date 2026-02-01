import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Image, Dimensions, Platform, Alert, Animated } from 'react-native';
import { MaterialCommunityIcons, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import {
    RTCPeerConnection,
    RTCIceCandidate,
    RTCSessionDescription,
    RTCView,
    mediaDevices,
    MediaStream,
} from '../utils/webrtc';
import SocketService from '../services/socketService';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

const LiveClassRoomScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute();
    const { user } = useAuth();
    const params = route.params as { topic?: string; roomId?: string; duration?: number } | undefined;
    const { topic = "Live Class", roomId, duration } = params || {};

    // Media Streams
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const peerConnection = useRef<RTCPeerConnection | null>(null);

    // Controls
    const [isMicOn, setIsMicOn] = useState(true);
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [showControls, setShowControls] = useState(true);
    const fadeAnim = useRef(new Animated.Value(1)).current;

    // Status
    const [connectionStatus, setConnectionStatus] = useState('Initializing...');

    // Timer
    const [timeLeft, setTimeLeft] = useState(duration ? duration * 60 : 3600);

    // Universal Video Component
    const UniversalVideo = ({ stream, style, objectFit, zOrder }: any) => {
        if (!stream) return null;

        if (Platform.OS === 'web') {
            return (
                <View style={style}>
                    {React.createElement('video', {
                        ref: (video: any) => {
                            if (video && stream) video.srcObject = stream;
                        },
                        autoPlay: true,
                        playsInline: true,
                        style: { width: '100%', height: '100%', objectFit: objectFit || 'cover' }
                    })}
                </View>
            );
        }

        return (
            <RTCView
                streamURL={stream.toURL ? stream.toURL() : null}
                style={style}
                objectFit={objectFit}
                zOrder={zOrder}
            />
        );
    };

    useEffect(() => {
        let isMounted = true;

        const startCall = async () => {
            setConnectionStatus('Getting User Media...');
            try {
                // 1. Get Local Stream
                const stream = await mediaDevices.getUserMedia({
                    audio: true,
                    video: true,
                });

                if (isMounted) {
                    setLocalStream(stream);
                    setConnectionStatus('Media Ready. Connecting Socket...');
                }

                // 2. Connect to Socket
                if (user?.token) {
                    SocketService.connect(user.token);
                    if (roomId) SocketService.joinRoom(roomId);
                }

                // 3. Setup Listeners and P2P
                setupSocketListeners();

            } catch (err) {
                console.error('Error starting call:', err);
                Alert.alert('Error', 'Failed to access camera/microphone');
            }
        };

        startCall();

        // Timer
        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => {
            isMounted = false;
            clearInterval(timer);
            if (localStream) {
                localStream.getTracks().forEach((t: any) => t.stop());
                // Avoid using release() on Web as it crashes
                if (Platform.OS !== 'web' && (localStream as any).release) {
                    (localStream as any).release();
                }
            }
            if (peerConnection.current) {
                peerConnection.current.close();
            }
            SocketService.disconnect();
        };
    }, []);

    const setupSocketListeners = () => {
        const socket = SocketService.socket;
        if (!socket) return;

        socket.on('user-connected', async (userId) => {
            console.log('User Connected:', userId);
            setConnectionStatus('Peer Joined. Initiating Offer...');
            await createOffer();
        });

        socket.on('offer', async (data) => {
            console.log('Received Offer');
            await handleOffer(data.offer);
        });

        socket.on('answer', async (data) => {
            console.log('Received Answer');
            await handleAnswer(data.answer);
        });

        socket.on('ice-candidate', async (data) => {
            console.log('Received ICE Candidate');
            await handleIceCandidate(data.candidate);
        });

        socket.on('user-disconnected', () => {
            Alert.alert('Disconnected', 'Peer left the meeting');
            if (remoteStream) {
                setRemoteStream(null); // Clear remote stream
            }
            setConnectionStatus('Peer Disconnected. Waiting...');
            if (peerConnection.current) {
                peerConnection.current.close();
                peerConnection.current = null;
            }
        });
    };

    const createPeerConnection = () => {
        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                // Add TURN servers here for production
            ],
        });

        // Add local tracks
        if (localStream) {
            localStream.getTracks().forEach(track => {
                pc.addTrack(track, localStream);
            });
        }

        // Use standard event listeners (Platform Agnostic Way) or 'as any' casting 
        // because react-native-webrtc types vs web standards mismatch
        (pc as any).onicecandidate = (event: any) => {
            if (event.candidate && roomId) {
                SocketService.sendIceCandidate({ roomId, candidate: event.candidate });
            }
        };

        (pc as any).ontrack = (event: any) => {
            console.log('Received Remote Stream');
            if (event.streams && event.streams[0]) {
                setRemoteStream(event.streams[0]);
                setConnectionStatus('Connected');
            }
        };

        peerConnection.current = pc;
        return pc;
    };

    const createOffer = async () => {
        const pc = createPeerConnection();
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        if (roomId) SocketService.sendOffer({ roomId, offer });
    };

    const handleOffer = async (offer: any) => {
        const pc = createPeerConnection();
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        if (roomId) SocketService.sendAnswer({ roomId, answer });
    };

    const handleAnswer = async (answer: any) => {
        if (peerConnection.current) {
            await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
        }
    };

    const handleIceCandidate = async (candidate: any) => {
        if (peerConnection.current) {
            await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
    };

    // Toggle Functions
    const toggleMic = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = !isMicOn;
            });
            setIsMicOn(!isMicOn);
        }
    };

    const toggleCamera = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach(track => {
                track.enabled = !isCameraOn;
            });
            setIsCameraOn(!isCameraOn);
        }
    };

    const switchCamera = () => {
        if (localStream) {
            // react-native-webrtc provides generic mechanism
            localStream.getVideoTracks().forEach(track => {
                if ((track as any)._switchCamera) (track as any)._switchCamera();
            });
        }
    };

    const toggleControls = () => {
        Animated.timing(fadeAnim, {
            toValue: showControls ? 0 : 1,
            duration: 300,
            useNativeDriver: true,
        }).start();
        setShowControls(!showControls);
    };

    const handleEndCall = () => {
        navigation.goBack();
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + ':' : ''}${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" hidden={!showControls} />

            <TouchableOpacity activeOpacity={1} onPress={toggleControls} style={styles.videoContainer}>
                {/* REMOTE STREAM (Full Screen) */}
                {remoteStream ? (
                    <UniversalVideo
                        stream={remoteStream}
                        style={styles.fullScreenVideo}
                        objectFit="cover"
                        zOrder={0}
                    />
                ) : (
                    <View style={styles.waitingContainer}>
                        <Image
                            source={{ uri: user?.avatar || 'https://ui-avatars.com/api/?name=' + (user?.name || 'User') + '&background=random&size=256' }}
                            style={styles.avatarLarge}
                        />
                        <Text style={styles.waitingText}>{connectionStatus}</Text>
                    </View>
                )}

                {/* Header */}
                <Animated.View style={[styles.headerOverlay, { opacity: fadeAnim }]}>
                    <LinearGradient
                        colors={['rgba(0,0,0,0.8)', 'transparent']}
                        style={styles.headerGradient}
                    >
                        <TouchableOpacity onPress={handleEndCall} style={styles.backButton}>
                            <Ionicons name="chevron-down" size={28} color="#fff" />
                        </TouchableOpacity>
                        <View style={styles.meetingInfo}>
                            <Text style={styles.roomTitle}>{topic}</Text>
                            <Text style={styles.roomSubtitle}>ID: {roomId?.slice(0, 8)}...</Text>
                        </View>
                        <View style={styles.timerChip}>
                            <View style={styles.recordingDot} />
                            <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
                        </View>
                    </LinearGradient>
                </Animated.View>

                {/* SELF STREAM (PiP) */}
                {localStream && (
                    <View style={styles.pipContainer}>
                        <UniversalVideo
                            stream={localStream}
                            style={styles.pipVideo}
                            objectFit="cover"
                            zOrder={1}
                        />
                    </View>
                )}
            </TouchableOpacity>

            {/* Controls */}
            <Animated.View style={[styles.controlsContainer, { opacity: fadeAnim }]}>
                <View style={styles.controlsWrapper}>
                    <TouchableOpacity style={[styles.controlButton, styles.endCallButton]} onPress={handleEndCall}>
                        <MaterialCommunityIcons name="phone-hangup" size={28} color="#fff" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.controlButton, !isMicOn && styles.controlButtonInactive]}
                        onPress={toggleMic}
                    >
                        <MaterialIcons name={isMicOn ? "mic" : "mic-off"} size={26} color={isMicOn ? "#fff" : "#1a1a1a"} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.controlButton, !isCameraOn && styles.controlButtonInactive]}
                        onPress={toggleCamera}
                    >
                        <MaterialIcons name={isCameraOn ? "videocam" : "videocam-off"} size={26} color={isCameraOn ? "#fff" : "#1a1a1a"} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.controlButton} onPress={switchCamera}>
                        <MaterialIcons name="flip-camera-ios" size={26} color="#fff" />
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#121212' },
    videoContainer: { flex: 1 },
    fullScreenVideo: { flex: 1, width: width, height: height, backgroundColor: '#000' },
    waitingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#202124' },
    avatarLarge: { width: 100, height: 100, borderRadius: 50, marginBottom: 20 },
    waitingText: { color: '#E8EAED', fontSize: 16, textAlign: 'center' },
    headerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
    headerGradient: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center' },
    backButton: { marginRight: 15 },
    meetingInfo: { flex: 1 },
    roomTitle: { color: '#E8EAED', fontSize: 18, fontWeight: '600' },
    roomSubtitle: { color: '#9AA0A6', fontSize: 12 },
    timerChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(32, 33, 36, 0.6)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
    recordingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#EA4335', marginRight: 6 },
    timerText: { color: '#E8EAED', fontSize: 12 },
    pipContainer: { position: 'absolute', bottom: 120, right: 16, width: 100, height: 150, borderRadius: 12, overflow: 'hidden', borderWidth: 2, borderColor: '#5F6368', elevation: 5, backgroundColor: '#333' },
    pipVideo: { flex: 1, width: '100%', height: '100%' },
    controlsContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#202124', paddingBottom: 40, paddingTop: 20, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
    controlsWrapper: { flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center' },
    controlButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#3C4043', justifyContent: 'center', alignItems: 'center' },
    controlButtonInactive: { backgroundColor: '#fff' },
    endCallButton: { backgroundColor: '#EA4335', width: 60 },
});

export default LiveClassRoomScreen;
