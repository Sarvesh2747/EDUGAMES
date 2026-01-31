import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../services/api';
import { searchOffline } from '../utils/offlineSearch';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: number;
}

const ChatbotScreen = () => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { isDark } = useAppTheme();

    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: "Hello! I'm your AI Tutor. Ask me anything about your Science lessons or the app!",
            sender: 'bot',
            timestamp: Date.now()
        }
    ]);
    const [loading, setLoading] = useState(false);
    const [isOffline, setIsOffline] = useState(false);
    const flatListRef = useRef<FlatList>(null);
    const { user } = useAuth();

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            setIsOffline(!state.isConnected);
        });
        return unsubscribe;
    }, []);

    const handleSend = async () => {
        if (!query.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            text: query,
            sender: 'user',
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, userMsg]);
        setQuery('');
        setLoading(true);

        try {
            let botResponse = '';

            // 1. Search Local Context
            const localContext = searchOffline(userMsg.text);

            // 2. Decide: Online or Offline response
            if (isOffline) {
                // OFFLINE MODE
                if (localContext.length > 0) {
                    botResponse = "Here's what I found in your offline lessons:\n\n";
                    localContext.forEach((item: any) => {
                        botResponse += `• *${item.title}*: ${item.text}\n\n`;
                    });
                } else {
                    botResponse = "I couldn't find anything in your offline lessons that matches that. Please try connecting to the internet for a better answer.";
                }
            } else {
                // ONLINE MODE
                try {
                    const mode = localContext.some((c: any) => c.type === 'help') ? 'app_help' : 'student_doubt';

                    const response = await api.post('/ai/chat', {
                        query: userMsg.text,
                        context: localContext,
                        mode: mode
                    });
                    botResponse = response.data.answer;
                } catch (apiError: any) {
                    console.error("AI API Error:", apiError);

                    const isModelError = apiError.response?.status === 404 || apiError.message?.includes('404');
                    const isRateLimit = apiError.response?.status === 429 || apiError.message?.includes('429');

                    let errorPrefix = "⚠️ *Connection Error*";
                    if (isModelError) {
                        errorPrefix = "⚠️ *System Error (404)*";
                    } else if (isRateLimit) {
                        errorPrefix = "⚠️ *High Traffic (Rate Limit)*";
                    }

                    if (localContext.length > 0) {
                        botResponse = `${errorPrefix} - Showing Offline Results\n\n`;
                        localContext.forEach((item: any) => {
                            botResponse += `• *${item.title}*: ${item.text}\n\n`;
                        });
                    } else {
                        if (isModelError) {
                            botResponse = `${errorPrefix}: The AI model is currently unavailable. Please contact support.`;
                        } else if (isRateLimit) {
                            botResponse = `${errorPrefix}: The AI brain is busy. Please try again in 5-10 seconds.`;
                        } else {
                            botResponse = `${errorPrefix}: I couldn't connect to the server and I couldn't find this on your offline lessons.\n\nTry asking about topics like 'Photosynthesis', 'Food', or 'Fibre'.`;
                        }
                    }
                }
            }

            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: botResponse,
                sender: 'bot',
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, botMsg]);

        } catch (error) {
            console.error("Chat Error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
    }, [messages]);

    // Starry background component
    const renderStars = () => {
        const stars = [];
        for (let i = 0; i < 80; i++) {
            stars.push(
                <View
                    key={i}
                    style={[
                        styles.star,
                        {
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            width: Math.random() * 3 + 1,
                            height: Math.random() * 3 + 1,
                            opacity: Math.random() * 0.8 + 0.2,
                        },
                    ]}
                />
            );
        }
        return stars;
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isUser = item.sender === 'user';
        return (
            <View style={[
                styles.messageContainer,
                isUser ? styles.userMessage : [styles.botMessage, isDark && styles.botMessageDark]
            ]}>
                {!isUser && (
                    <View style={styles.botIconContainer}>
                        <LinearGradient
                            colors={['#6366F1', '#A855F7']}
                            style={styles.botIconGradient}
                        >
                            <MaterialCommunityIcons name="robot" size={16} color="#FFF" />
                        </LinearGradient>
                    </View>
                )}
                <Text style={[
                    styles.messageText,
                    isUser ? styles.userText : [styles.botText, isDark && { color: '#E2E8F0' }]
                ]}>
                    {item.text}
                </Text>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            {/* Unified App Background */}
            <LinearGradient
                colors={isDark ? ['#0A1628', '#0F172A', '#1E293B'] : ['#F0F9FF', '#E0F2FE', '#BAE6FD']}
                style={[StyleSheet.absoluteFill, { zIndex: -1 }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            {/* Starry Background for Dark Mode */}
            {isDark && (
                <View style={styles.starsContainer}>
                    {renderStars()}
                </View>
            )}

            {/* Premium Header */}
            <LinearGradient
                colors={['#6366F1', '#8B5CF6', '#A855F7']}
                style={[styles.header, { paddingTop: insets.top + 10 }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>AI Tutor {isOffline ? '(Offline)' : ''}</Text>
                    <TouchableOpacity style={styles.helpButton}>
                        <Ionicons name="help-circle-outline" size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={item => item.id}
                renderItem={renderMessage}
                contentContainerStyle={[styles.listContent, { paddingBottom: 100 }]} // Extra padding for input
                style={styles.list}
                showsVerticalScrollIndicator={false}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                style={styles.keyboardView}
            >
                <View style={[styles.inputContainer, isDark && styles.inputContainerDark, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                    <TextInput
                        style={[styles.input, isDark && styles.inputDark]}
                        placeholder="Ask a doubt..."
                        placeholderTextColor={isDark ? "#94A3B8" : "#666"}
                        value={query}
                        onChangeText={setQuery}
                        onSubmitEditing={handleSend}
                    />
                    <TouchableOpacity onPress={handleSend} disabled={loading} style={styles.sendButton}>
                        {loading ? (
                            <ActivityIndicator color="#FFF" size="small" />
                        ) : (
                            <LinearGradient
                                colors={['#6366F1', '#A855F7']}
                                style={styles.sendGradient}
                            >
                                <Ionicons name="send" size={20} color="#FFF" />
                            </LinearGradient>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    starsContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
    },
    star: {
        position: 'absolute',
        backgroundColor: '#FFFFFF',
        borderRadius: 50,
    },
    header: {
        paddingBottom: 25,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        zIndex: 10,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 20,
    },
    helpButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFF',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    list: {
        flex: 1,
    },
    listContent: {
        padding: 20,
        paddingTop: 30, // Space from header
    },
    messageContainer: {
        maxWidth: '85%',
        padding: 16,
        borderRadius: 20,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    userMessage: {
        alignSelf: 'flex-end',
        backgroundColor: '#6366F1', // Primary Purple
        borderBottomRightRadius: 4,
    },
    botMessage: {
        alignSelf: 'flex-start',
        backgroundColor: '#FFF',
        borderBottomLeftRadius: 4,
        marginLeft: 8,
    },
    botMessageDark: {
        backgroundColor: '#1E293B',
        borderWidth: 1,
        borderColor: '#334155',
    },
    botIconContainer: {
        position: 'absolute',
        top: -10,
        left: -10,
        zIndex: 1,
    },
    botIconGradient: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
    },
    messageText: {
        fontSize: 16,
        lineHeight: 24,
    },
    userText: {
        color: '#FFF'
    },
    botText: {
        color: '#333'
    },
    keyboardView: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 16,
        paddingTop: 12,
        backgroundColor: '#FFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    inputContainerDark: {
        backgroundColor: '#1E293B',
        borderTopWidth: 1,
        borderTopColor: '#334155',
    },
    input: {
        flex: 1,
        backgroundColor: '#F1F5F9',
        borderRadius: 24,
        paddingHorizontal: 20,
        paddingVertical: 12,
        fontSize: 16,
        marginRight: 12,
        color: '#333',
    },
    inputDark: {
        backgroundColor: '#0F172A',
        color: '#FFF',
    },
    sendButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },
    sendGradient: {
        width: '100%',
        height: '100%',
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    }
});

export default ChatbotScreen;
