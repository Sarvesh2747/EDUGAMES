import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import ScreenBackground from '../../components/ScreenBackground';
import api from '../../services/api';
import { useAppTheme } from '../../context/ThemeContext';
import Markdown from 'react-native-markdown-display';

const NotebookDetailScreen = () => {
    const { params }: any = useRoute();
    const navigation = useNavigation();
    const { isDark } = useAppTheme();
    const insets = useSafeAreaInsets();
    const { id, title } = params;

    const [doc, setDoc] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [activeTab, setActiveTab] = useState('summary'); // summary, chat

    useEffect(() => {
        fetchDoc();
    }, []);

    const fetchDoc = async () => {
        try {
            const res = await api.get(`/notebook/${id}`);
            setDoc(res.data);

            // Auto analyze if just uploaded
            if (res.data.status === 'uploaded' && !analyzing) {
                handleAnalyze();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAnalyze = async () => {
        setAnalyzing(true);
        try {
            const res = await api.post(`/notebook/${id}/analyze`);
            setDoc(res.data);
        } catch (error) {
            console.error('Analysis failed');
        } finally {
            setAnalyzing(false);
        }
    };

    const styles = getStyles(isDark, insets);

    // Markdown Styles
    const markdownStyles = {
        body: { color: isDark ? '#E2E8F0' : '#334155', fontSize: 16, lineHeight: 26 },
        heading1: { color: isDark ? '#fff' : '#1E293B', fontSize: 24, fontWeight: '800', marginVertical: 12 },
        heading2: { color: isDark ? '#fff' : '#1E293B', fontSize: 20, fontWeight: '700', marginVertical: 10 },
        strong: { color: '#6366F1', fontWeight: '700' },
        list_item: { marginVertical: 4 },
        link: { color: '#6366F1' },
    };

    if (loading) {
        return (
            <ScreenBackground style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#6366F1" />
            </ScreenBackground>
        );
    }

    return (
        <ScreenBackground style={styles.container}>
            {/* 🌟 PREMIUM HEADER */}
            <LinearGradient
                colors={isDark ? ['#0A1628', '#1E293B'] : ['#6366F1', '#8B5CF6', '#A855F7']}
                style={styles.headerBackground}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={[styles.headerContent, { paddingTop: insets.top + 10 }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
                        <Text style={styles.headerSubtitle}>
                            {doc?.wordCount ? `${doc.wordCount} words` : 'Document'} • {doc?.status === 'analyzed' ? 'Analyzed' : 'Processing'}
                        </Text>
                    </View>
                    <TouchableOpacity style={styles.iconButton}>
                        <MaterialCommunityIcons name="dots-vertical" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* TABS IN HEADER */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'summary' && styles.activeTab]}
                        onPress={() => setActiveTab('summary')}
                    >
                        <Text style={[styles.tabText, activeTab === 'summary' && styles.activeTabText]}>Summary</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'chat' && styles.activeTab]}
                        onPress={() => setActiveTab('chat')}
                    >
                        <Text style={[styles.tabText, activeTab === 'chat' && styles.activeTabText]}>Detailed View</Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {analyzing ? (
                    <View style={styles.analyzingState}>
                        <ActivityIndicator size="large" color="#6366F1" />
                        <Text style={styles.analyzingText}>AI is analyzing your document...</Text>
                        <Text style={styles.analyzingSubText}>Generating summary, flashcards, and quiz...</Text>
                    </View>
                ) : !doc?.summary ? (
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="robot-confused-outline" size={64} color="rgba(255,255,255,0.3)" />
                        <Text style={styles.emptyText}>Analysis not ready</Text>
                        <TouchableOpacity style={styles.primaryButton} onPress={handleAnalyze}>
                            <Text style={styles.primaryButtonText}>Analyze Now</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <Animated.View entering={FadeInDown.delay(200)}>
                        {/* Executive Summary Card */}
                        {activeTab === 'summary' && (
                            <>
                                <Surface style={styles.card} elevation={2}>
                                    <LinearGradient
                                        colors={isDark ? ['rgba(245, 158, 11, 0.15)', 'rgba(245, 158, 11, 0.05)'] : ['#FEF3C7', '#FFFBEB']}
                                        style={styles.summaryGradient}
                                    >
                                        <View style={styles.cardHeader}>
                                            <MaterialCommunityIcons name="lightning-bolt" size={24} color="#F59E0B" />
                                            <Text style={styles.cardTitle}>Executive Summary</Text>
                                        </View>
                                        <Text style={styles.summaryText}>{doc.summary.executive}</Text>
                                    </LinearGradient>
                                </Surface>

                                <Text style={styles.sectionTitle}>Key Points</Text>
                                <View style={styles.pointsList}>
                                    {doc.summary.keyPoints?.map((point: string, index: number) => (
                                        <Surface key={index} style={styles.pointCard}>
                                            <View style={styles.pointIndexContainer}>
                                                <Text style={styles.pointIndex}>{index + 1}</Text>
                                            </View>
                                            <Text style={styles.pointText}>{point}</Text>
                                        </Surface>
                                    ))}
                                </View>

                                {/* Action Buttons Grid */}
                                <View style={styles.actionsGrid}>
                                    <TouchableOpacity
                                        style={[styles.actionCard, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#ECFDF5' }]}
                                        activeOpacity={0.8}
                                        onPress={async () => {
                                            if (!doc.flashcards?.length) {
                                                await api.post(`/notebook/${id}/flashcards`);
                                                fetchDoc();
                                            }
                                            // Navigation placeholder
                                            alert('Flashcards Generated! (Nav to be implemented)');
                                        }}
                                    >
                                        <View style={[styles.actionIcon, { backgroundColor: '#10B981' }]}>
                                            <MaterialCommunityIcons name="cards-outline" size={32} color="#fff" />
                                        </View>
                                        <View>
                                            <Text style={[styles.actionLabel, { color: '#047857' }]}>Study Flashcards</Text>
                                            <Text style={[styles.actionSub, { color: '#065F46' }]}>Master concepts</Text>
                                        </View>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.actionCard, { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.1)' : '#EEF2FF' }]}
                                        activeOpacity={0.8}
                                        onPress={async () => {
                                            if (!doc.quiz?.length) {
                                                await api.post(`/notebook/${id}/quiz`);
                                                fetchDoc();
                                            }
                                            alert('Quiz Generated! (Nav to be implemented)');
                                        }}
                                    >
                                        <View style={[styles.actionIcon, { backgroundColor: '#6366F1' }]}>
                                            <MaterialCommunityIcons name="brain" size={32} color="#fff" />
                                        </View>
                                        <View>
                                            <Text style={[styles.actionLabel, { color: '#4338CA' }]}>Take AI Quiz</Text>
                                            <Text style={[styles.actionSub, { color: '#3730A3' }]}>Test knowledge</Text>
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}

                        {activeTab === 'chat' && (
                            <Surface style={styles.markdownCard} elevation={2}>
                                <View style={styles.markdownContainer}>
                                    <Markdown style={markdownStyles as any}>
                                        {doc.summary.detailedAnalysis}
                                    </Markdown>
                                </View>
                            </Surface>
                        )}
                    </Animated.View>
                )}
                <View style={{ height: 40 }} />
            </ScrollView>
        </ScreenBackground>
    );
};

const getStyles = (isDark: boolean, insets: any) => StyleSheet.create({
    container: { flex: 1 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    // Header
    headerBackground: {
        paddingBottom: 24,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        overflow: 'hidden',
        elevation: 4,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitleContainer: {
        flex: 1,
        marginHorizontal: 12,
    },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
    headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },

    // Tabs
    tabContainer: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        gap: 24,
    },
    tab: {
        paddingVertical: 10,
        paddingHorizontal: 4,
    },
    activeTab: {
        borderBottomWidth: 3,
        borderBottomColor: '#FFD700', // Gold accent for active tab
    },
    tabText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 16,
        fontWeight: '600',
    },
    activeTabText: {
        color: '#fff',
        fontWeight: '700',
    },

    // Content
    content: {
        padding: 20,
        paddingTop: 24, // Slight overlap spacing if needed, but here we just push down
    },

    // Summary Card
    card: {
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 24,
        backgroundColor: isDark ? '#1E293B' : '#fff',
    },
    summaryGradient: {
        padding: 20,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#F59E0B',
    },
    summaryText: {
        fontSize: 16,
        lineHeight: 26,
        color: isDark ? 'rgba(255,255,255,0.9)' : '#334155',
        fontWeight: '500',
    },

    // Key Points
    sectionTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: isDark ? '#fff' : '#1E293B',
        marginBottom: 16,
    },
    pointsList: {
        gap: 12,
        marginBottom: 24,
    },
    pointCard: {
        flexDirection: 'row',
        backgroundColor: isDark ? 'rgba(30, 41, 59, 0.6)' : '#fff',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    },
    pointIndexContainer: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 2,
    },
    pointIndex: {
        fontSize: 14,
        fontWeight: '800',
        color: '#6366F1',
    },
    pointText: {
        flex: 1,
        marginLeft: 12,
        fontSize: 15,
        color: isDark ? 'rgba(255,255,255,0.8)' : '#475569',
        lineHeight: 24,
    },

    // Actions
    actionsGrid: {
        flexDirection: 'row',
        gap: 16,
    },
    actionCard: {
        flex: 1,
        padding: 20,
        borderRadius: 24,
        gap: 12,
        // elevation: 2,
    },
    actionIcon: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionLabel: {
        fontWeight: '800',
        fontSize: 16,
        marginBottom: 4,
    },
    actionSub: {
        fontSize: 12,
        fontWeight: '600',
    },

    // Markdown
    markdownCard: {
        backgroundColor: isDark ? '#1E293B' : '#fff',
        borderRadius: 20,
        overflow: 'hidden',
    },
    markdownContainer: {
        padding: 24,
    },

    // States
    analyzingState: {
        padding: 40,
        alignItems: 'center',
        gap: 16,
    },
    analyzingText: {
        color: isDark ? '#fff' : '#1E293B',
        fontSize: 18,
        fontWeight: '700',
    },
    analyzingSubText: {
        color: isDark ? 'rgba(255,255,255,0.6)' : '#64748B',
        fontSize: 14,
    },
    emptyState: { alignItems: 'center', padding: 40, gap: 16 },
    emptyText: { color: 'rgba(255,255,255,0.5)', fontSize: 16 },
    primaryButton: {
        backgroundColor: '#6366F1',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
    },
    primaryButtonText: { color: '#fff', fontWeight: 'bold' },
});

export default NotebookDetailScreen;
