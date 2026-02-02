import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../services/api';
import { searchOffline } from '../utils/offlineSearch';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';
import ScreenBackground from '../components/ScreenBackground';

const { width } = Dimensions.get('window');
const MAX_WIDTH = 800; // Max width for web

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

    const containerWidth = Platform.OS === 'web' && width > MAX_WIDTH ? MAX_WIDTH : width;

    return (
        <ScreenBackground style={styles.wrapper}>
            <View style={[styles.container, Platform.OS === 'web' && width > MAX_WIDTH && { width: containerWidth, alignSelf: 'center' }]}>
                {/* Header */}
                <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#5f6368" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>AI Tutor {isOffline ? '(Offline)' : ''}</Text>
                    <TouchableOpacity style={styles.helpButton}>
                        <Ionicons name="help-circle-outline" size={24} color="#5f6368" />
                    </TouchableOpacity>
                </View>

                {/* Main Content Area */}
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
                    style={styles.keyboardView}
                >
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        keyExtractor={item => item.id}
                        renderItem={renderMessage}
                        contentContainerStyle={[styles.listContent, { paddingBottom: 20 }]}
                        style={styles.list}
                        showsVerticalScrollIndicator={false}
                    />

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
        </ScreenBackground>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        // Removed backgroundColor to act responsibly with ScreenBackground
    },
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        zIndex: 10, // Ensure header shadow maps correctly
    },
    backButton: {
        padding: 8,
        borderRadius: 20,
    },
    helpButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#202124',
    },
    list: {
        flex: 1,
    },
    listContent: {
        padding: 20,
        paddingTop: 20,
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
        backgroundColor: '#6366F1',
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
        flex: 1, // Changed from absolute positioning to flex
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
