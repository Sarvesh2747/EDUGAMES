import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, UIManager, Platform, LayoutAnimation, ActivityIndicator, TextInput, Dimensions, Pressable } from 'react-native';
import { Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import ScreenBackground from '../../components/ScreenBackground';
import api from '../../services/api';
import { useAppTheme } from '../../context/ThemeContext';
import { useResponsive } from '../../hooks/useResponsive';
import Markdown from 'react-native-markdown-display';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const ScaleButton = ({ onPress, style, children, ...props }: any) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }]
    }));

    const onPressIn = () => {
        scale.value = withSpring(0.95);
    };

    const onPressOut = () => {
        scale.value = withSpring(1);
    };

    return (
        <AnimatedPressable
            onPress={onPress}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            style={[style, animatedStyle]}
            {...props}
        >
            {children}
        </AnimatedPressable>
    );
};

const NotebookScreen = () => {
    const navigation: any = useNavigation();
    const { isDark } = useAppTheme();
    const insets = useSafeAreaInsets();
    const { isMobile } = useResponsive();

    // Data State
    const [documents, setDocuments] = useState([]);
    const [selectedDoc, setSelectedDoc] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);

    // UI State
    const [activeTab, setActiveTab] = useState('summary');
    const [activeMobileTab, setActiveMobileTab] = useState('sources');

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            const res = await api.get('/notebook');
            setDocuments(res.data);
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectDoc = async (docId: string) => {
        const preview = documents.find((d: any) => d._id === docId);
        setSelectedDoc(preview);

        if (isMobile) {
            setActiveMobileTab('chat');
        }

        setLoading(true);
        try {
            const res = await api.get(`/notebook/${docId}`);
            setSelectedDoc(res.data);
            if (res.data.status === 'uploaded') {
                handleAnalyze(docId);
            }
        } catch (error) {
            console.error("Error fetching doc details:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAnalyze = async (docId: string = selectedDoc?._id) => {
        if (!docId) return;
        setAnalyzing(true);
        try {
            const res = await api.post(`/notebook/${docId}/analyze`);
            setSelectedDoc(res.data);
            setDocuments(prev => prev.map((d: any) => d._id === docId ? { ...d, status: 'analyzed' } : d) as any);
        } catch (error) {
            console.error('Analysis failed', error);
        } finally {
            setAnalyzing(false);
        }
    };

    const handleUpload = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'text/plain', 'text/markdown'],
                copyToCacheDirectory: true
            });

            if (result.canceled) return;
            setUploading(true);
            const formData = new FormData();
            formData.append('file', {
                uri: result.assets[0].uri,
                name: result.assets[0].name,
                type: result.assets[0].mimeType
            } as any);

            await api.post('/notebook/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            await fetchDocuments();
        } catch (error) {
            console.error('Upload failed', error);
            alert('Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const toggleMobileTab = (tab: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setActiveMobileTab(tab);
    }

    // --- RENDERERS ---

    const renderLeftPanel = () => (
        <Surface style={[styles.panel, styles.leftPanel]} elevation={2}>
            <View style={styles.panelHeader}>
                <Text style={styles.panelTitle}>SOURCES</Text>
                <TouchableOpacity
                    style={styles.addSourceButtonSmall}
                    onPress={handleUpload}
                    disabled={uploading}
                >
                    <MaterialCommunityIcons name="plus" size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.sourcesList} showsVerticalScrollIndicator={false}>
                {documents.length === 0 ? (
                    <View style={styles.emptySources}>
                        <MaterialCommunityIcons name="file-document-outline" size={32} color="rgba(255,255,255,0.2)" />
                        <Text style={styles.emptySourcesText}>No sources</Text>
                    </View>
                ) : (
                    documents.map((doc: any) => (
                        <ScaleButton
                            key={doc._id}
                            style={[
                                styles.sourceItem,
                                selectedDoc?._id === doc._id && styles.sourceItemActive
                            ]}
                            onPress={() => handleSelectDoc(doc._id)}
                        >
                            <View style={[styles.sourceIcon, selectedDoc?._id === doc._id && styles.sourceIconActive]}>
                                <MaterialCommunityIcons
                                    name={doc.type === 'pdf' ? 'file-pdf-box' : 'file-document'}
                                    size={18}
                                    color={selectedDoc?._id === doc._id ? '#fff' : 'rgba(255,255,255,0.5)'}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.sourceName, selectedDoc?._id === doc._id && styles.sourceNameActive]} numberOfLines={1}>
                                    {doc.title}
                                </Text>
                                <Text style={styles.sourceMeta}>
                                    {doc.status === 'analyzed' ? 'Ready' : 'Processing...'}
                                </Text>
                            </View>
                        </ScaleButton>
                    ))
                )}
            </ScrollView>
        </Surface>
    );

    const renderCenterPanel = () => (
        <Surface style={[styles.panel, styles.centerPanel]} elevation={4}>
            {!selectedDoc ? (
                <View style={styles.emptyState}>
                    <MaterialCommunityIcons name="star-four-points" size={64} color="rgba(99, 102, 241, 0.2)" />
                    <Text style={styles.emptyStateTitle}>AI Notebook</Text>
                    <Text style={styles.emptyStateSub}>Select a source to unlock AI-powered insights.</Text>
                    {isMobile && (
                        <TouchableOpacity style={styles.mobileSelectBtn} onPress={() => toggleMobileTab('sources')}>
                            <Text style={styles.mobileSelectBtnText}>Select Source</Text>
                        </TouchableOpacity>
                    )}
                </View>
            ) : (
                <>
                    <View style={styles.centerHeader}>
                        {isMobile && (
                            <TouchableOpacity onPress={() => toggleMobileTab('sources')} style={styles.backIcon}>
                                <MaterialCommunityIcons name="arrow-left" size={24} color="rgba(255,255,255,0.7)" />
                            </TouchableOpacity>
                        )}
                        <View style={styles.pillContainer}>
                            <TouchableOpacity onPress={() => setActiveTab('summary')} style={[styles.pill, activeTab === 'summary' && styles.activePill]}>
                                <Text style={[styles.pillText, activeTab === 'summary' && styles.activePillText]}>Summary</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setActiveTab('chat')} style={[styles.pill, activeTab === 'chat' && styles.activePill]}>
                                <Text style={[styles.pillText, activeTab === 'chat' && styles.activePillText]}>Chat</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <ScrollView contentContainerStyle={styles.centerContent} showsVerticalScrollIndicator={false}>
                        {analyzing ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#6366F1" />
                                <Text style={styles.loadingText}>Analyzing document...</Text>
                            </View>
                        ) : activeTab === 'summary' && selectedDoc.summary ? (
                            <Animated.View entering={FadeInDown}>
                                <LinearGradient
                                    colors={isDark ? ['rgba(245, 158, 11, 0.15)', 'rgba(245, 158, 11, 0.05)'] : ['#FFFBEB', '#FFF']}
                                    style={styles.summaryCard}
                                >
                                    <View style={styles.summaryHeader}>
                                        <View style={styles.iconCircleAmber}>
                                            <MaterialCommunityIcons name="lightning-bolt" size={20} color="#F59E0B" />
                                        </View>
                                        <Text style={styles.summaryTitle}>Executive Summary</Text>
                                    </View>
                                    <Text style={styles.summaryText}>{selectedDoc.summary.executive}</Text>
                                </LinearGradient>

                                <Text style={styles.sectionHeading}>Key Takeaways</Text>
                                {selectedDoc.summary.keyPoints?.map((point: string, idx: number) => (
                                    <View key={idx} style={styles.keyPointItem}>
                                        <Text style={styles.keyPointBullet}>•</Text>
                                        <Text style={styles.keyPointText}>{point}</Text>
                                    </View>
                                ))}
                            </Animated.View>
                        ) : (
                            <View style={styles.markdownWrapper}>
                                <Markdown style={markdownStyles as any}>
                                    {selectedDoc.summary?.detailedAnalysis || "No detailed analysis available."}
                                </Markdown>
                            </View>
                        )}
                        <View style={{ height: 100 }} />
                    </ScrollView>

                    <View style={styles.chatInputWrapper}>
                        <View style={styles.chatInputContainer}>
                            <TextInput
                                style={styles.chatInput}
                                placeholder="Ask about this document..."
                                placeholderTextColor="rgba(255,255,255,0.4)"
                            />
                            <TouchableOpacity style={styles.sendButton}>
                                <MaterialCommunityIcons name="arrow-up" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </>
            )}
        </Surface>
    );

    const renderStudioButton = (label: string, icon: string, gradient: string[], subtitle: string = '') => (
        <ScaleButton style={styles.bentoItem} onPress={() => { }}>
            <Surface style={styles.bentoSurface} elevation={2}>
                <LinearGradient
                    colors={gradient as any}
                    style={styles.bentoGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <MaterialCommunityIcons name={icon as any} size={24} color="#fff" />
                    <View>
                        <Text style={styles.bentoTitle}>{label}</Text>
                        {!!subtitle && <Text style={styles.bentoSubtitle}>{subtitle}</Text>}
                    </View>
                </LinearGradient>
            </Surface>
        </ScaleButton>
    );

    const renderRightPanel = () => (
        <View style={isMobile ? styles.mobilePanel : styles.rightPanel}>
            <View style={styles.panelHeader}>
                <Text style={styles.panelTitle}>STUDIO TOOLS</Text>
            </View>

            <View style={styles.studioGrid}>
                {renderStudioButton('Audio Guide', 'microphone', ['#6366F1', '#4F46E5'], 'Listen')}
                {renderStudioButton('Mind Map', 'sitemap', ['#0EA5E9', '#0284C7'], 'Visualize')}
                {renderStudioButton('Flashcards', 'cards-outline', ['#F59E0B', '#D97706'], 'Review')}
                {renderStudioButton('Quiz', 'help-circle-outline', ['#EC4899', '#BE185D'], 'Test')}
            </View>

            <View style={styles.notesSection}>
                <Text style={styles.panelTitle}>QUICK NOTES</Text>
                <TouchableOpacity style={styles.addNoteBtn}>
                    <MaterialCommunityIcons name="plus" size={16} color="rgba(255,255,255,0.6)" />
                    <Text style={styles.addNoteText}>Add a note...</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const styles = getStyles(isDark, insets, isMobile);

    const markdownStyles = {
        body: { color: isDark ? 'rgba(255,255,255,0.8)' : '#334155', fontSize: 15, lineHeight: 24 },
        heading1: { color: isDark ? '#fff' : '#1E293B', fontSize: 22, fontWeight: '700', marginVertical: 10 },
        heading2: { color: isDark ? '#fff' : '#1E293B', fontSize: 18, fontWeight: '700', marginVertical: 8 },
        strong: { color: '#6366F1', fontWeight: '700' },
        list_item: { marginVertical: 4 },
    };

    return (
        <ScreenBackground style={styles.container}>
            {/* 🌟 PREMIUM HERO HEADER */}
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
                        <Text style={styles.headerTitle}>NotebookLM</Text>
                        <Text style={styles.headerSubtitle}>AI Research Assistant</Text>
                    </View>
                </View>

                {/* Mobile Tab Pills inside Header */}
                {isMobile && (
                    <View style={styles.mobileTabSelector}>
                        {['sources', 'chat', 'studio'].map((tab) => (
                            <TouchableOpacity
                                key={tab}
                                style={[styles.mobileTabItem, activeMobileTab === tab && styles.mobileTabItemActive]}
                                onPress={() => toggleMobileTab(tab)}
                            >
                                <Text style={[styles.mobileTabText, activeMobileTab === tab && styles.mobileTabTextActive]}>
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                <MaterialCommunityIcons name="notebook" size={180} color="white" style={styles.headerWatermark} />
            </LinearGradient>

            {/* Overlapping Main Content */}
            <View style={styles.dashboardContainer}>
                {isMobile ? (
                    <View style={{ flex: 1 }}>
                        {activeMobileTab === 'sources' && renderLeftPanel()}
                        {activeMobileTab === 'chat' && renderCenterPanel()}
                        {activeMobileTab === 'studio' && renderRightPanel()}
                    </View>
                ) : (
                    <>
                        <View style={{ width: 260, marginRight: 16 }}>{renderLeftPanel()}</View>
                        <View style={{ flex: 1, marginRight: 16 }}>{renderCenterPanel()}</View>
                        <View style={{ width: 260 }}>{renderRightPanel()}</View>
                    </>
                )}
            </View>
        </ScreenBackground>
    );
};

const getStyles = (isDark: boolean, insets: any, isMobile: boolean) => StyleSheet.create({
    container: {
        flex: 1,
    },
    headerBackground: {
        paddingBottom: 60,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        overflow: 'hidden',
        zIndex: 0,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 16,
        zIndex: 10,
    },
    headerTitleContainer: {
        justifyContent: 'center',
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.7)',
        fontWeight: '500',
    },
    headerWatermark: {
        position: 'absolute',
        right: -20,
        bottom: -30,
        opacity: 0.1,
        transform: [{ rotate: '-15deg' }],
    },

    // Mobile Tabs
    mobileTabSelector: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        gap: 12,
        marginBottom: 10,
    },
    mobileTabItem: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    mobileTabItemActive: {
        backgroundColor: '#fff',
    },
    mobileTabText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 13,
        fontWeight: '600',
    },
    mobileTabTextActive: {
        color: '#6366F1',
    },

    // Dashboard Container with Overlap
    dashboardContainer: {
        flex: 1,
        flexDirection: 'row',
        marginTop: -40, // The Overlap Magic
        paddingHorizontal: isMobile ? 12 : 24,
        paddingBottom: 20,
    },

    // Panels
    panel: {
        flex: 1,
        backgroundColor: isDark ? '#1E293B' : '#fff', // Match Home Cards
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    },
    leftPanel: {
        backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : '#fff',
    },
    centerPanel: {
        // Center panel is the "main stage"
        backgroundColor: isDark ? '#0F172A' : '#FAFAFA',
    },
    mobilePanel: {
        flex: 1,
        backgroundColor: isDark ? '#1E293B' : '#fff',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
        overflow: 'hidden',
        marginBottom: 20,
    },
    rightPanel: {
        // Transparent BG for studio grid usually, but here we can contain it
        // Or just let buttons float. But structure says "View", not Surface.
        // Let's make it a View container for bento items if desktop.
    },

    // Headers
    panelHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    },
    panelTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: isDark ? 'rgba(255,255,255,0.5)' : '#94A3B8',
        letterSpacing: 1,
    },
    addSourceButtonSmall: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: '#6366F1',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Sources List
    sourcesList: {
        padding: 12,
        gap: 8,
    },
    sourceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: 12,
        backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
        gap: 12,
    },
    sourceItemActive: {
        backgroundColor: isDark ? '#334155' : '#EEF2FF',
        borderWidth: 1,
        borderColor: '#6366F1',
    },
    sourceIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sourceIconActive: {
        backgroundColor: '#6366F1',
    },
    sourceName: {
        color: isDark ? 'rgba(255,255,255,0.7)' : '#334155',
        fontSize: 14,
        fontWeight: '600',
    },
    sourceNameActive: {
        color: isDark ? '#fff' : '#1E293B',
    },
    sourceMeta: {
        fontSize: 11,
        color: isDark ? 'rgba(255,255,255,0.3)' : '#94A3B8',
    },
    emptySources: {
        alignItems: 'center',
        paddingVertical: 40,
        gap: 8,
    },
    emptySourcesText: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 13,
    },

    // Center Panel
    centerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    },
    backIcon: { marginRight: 12 },
    pillContainer: {
        flexDirection: 'row',
        backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : '#F1F5F9',
        padding: 4,
        borderRadius: 12,
        gap: 4,
    },
    pill: {
        paddingVertical: 6,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    activePill: {
        backgroundColor: isDark ? '#334155' : '#fff',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    pillText: {
        fontSize: 13,
        fontWeight: '600',
        color: isDark ? 'rgba(255,255,255,0.5)' : '#64748B',
    },
    activePillText: {
        color: isDark ? '#fff' : '#0F172A',
    },
    centerContent: {
        padding: 24,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyStateTitle: {
        color: isDark ? '#fff' : '#1E293B',
        fontSize: 22,
        fontWeight: '800',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyStateSub: {
        color: isDark ? 'rgba(255,255,255,0.5)' : '#64748B',
        textAlign: 'center',
        fontSize: 15,
        marginBottom: 24,
    },
    mobileSelectBtn: {
        backgroundColor: '#6366F1',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    mobileSelectBtnText: {
        color: '#fff',
        fontWeight: '700',
    },
    summaryCard: {
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: isDark ? '#F59E0B20' : '#FEF3C7',
        marginBottom: 24,
    },
    summaryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    iconCircleAmber: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: '#F59E0B20',
        justifyContent: 'center',
        alignItems: 'center',
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#F59E0B',
    },
    summaryText: {
        fontSize: 15,
        lineHeight: 24,
        color: isDark ? 'rgba(255,255,255,0.9)' : '#334155',
    },
    sectionHeading: {
        fontSize: 18,
        fontWeight: '700',
        color: isDark ? '#fff' : '#1E293B',
        marginBottom: 16,
    },
    keyPointItem: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    keyPointBullet: {
        color: '#6366F1',
        fontSize: 18,
        fontWeight: '800',
    },
    keyPointText: {
        fontSize: 15,
        lineHeight: 22,
        color: isDark ? 'rgba(255,255,255,0.8)' : '#475569',
        flex: 1,
    },
    chatInputWrapper: {
        position: 'absolute',
        bottom: 24,
        left: 24,
        right: 24,
    },
    chatInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: isDark ? '#1E293B' : '#fff',
        borderRadius: 30,
        padding: 4,
        paddingLeft: 20,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 6,
    },
    chatInput: {
        flex: 1,
        color: isDark ? '#fff' : '#1E293B',
        fontSize: 15,
        paddingVertical: 12,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#6366F1',
        justifyContent: 'center',
        alignItems: 'center',
    },
    studioGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        padding: isMobile ? 0 : 0, // Padding handled by panel
    },
    bentoItem: {
        width: '48%',
        height: 100,
    },
    bentoSurface: {
        flex: 1,
        borderRadius: 16,
        overflow: 'hidden',
    },
    bentoGradient: {
        flex: 1,
        padding: 12,
        justifyContent: 'space-between',
    },
    bentoTitle: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
    },
    bentoSubtitle: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 10,
        fontWeight: '600',
    },
    notesSection: {
        marginTop: 24,
    },
    addNoteBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        borderStyle: 'dashed',
    },
    addNoteText: {
        color: isDark ? 'rgba(255,255,255,0.5)' : '#94A3B8',
        fontSize: 13,
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
        gap: 16,
    },
    loadingText: {
        color: isDark ? 'rgba(255,255,255,0.7)' : '#64748B',
    },
    markdownWrapper: {
        // Markdown styles wrapper
    }
});

export default NotebookScreen;
