import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { theme, gradients, spacing, borderRadius } from '../theme';
import { useTranslation } from '../i18n';
import { fetchClassroomContent, ClassroomItem } from '../services/studentService';
import { ActivityIndicator, Modal, ScrollView as NativeScrollView } from 'react-native';

const ClassroomScreen = () => {
    const navigation = useNavigation<any>();
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const [activeTab, setActiveTab] = useState('stream');
    const [classroomContent, setClassroomContent] = useState<ClassroomItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedChapter, setSelectedChapter] = useState<ClassroomItem | null>(null);

    const [meta, setMeta] = useState({
        className: 'Loading...',
        schoolName: '',
        teachers: [] as any[]
    });

    React.useEffect(() => {
        loadContent();
    }, []);

    const loadContent = async () => {
        try {
            const data = await fetchClassroomContent();
            setClassroomContent(data.content);
            setMeta(data.meta);
        } catch (error) {
            console.error('Failed to load classroom content', error);
        } finally {
            setLoading(false);
        }
    };

    const handleItemPress = (item: ClassroomItem) => {
        if (item.type === 'quiz' && item.questions) {
            navigation.navigate('Quiz', {
                quizData: {
                    id: item.id,
                    quizId: item.id,
                    questions: item.questions,
                    title: item.title
                }
            });
        } else if (item.type === 'chapter') {
            setSelectedChapter(item);
        }
    };

    const liveClasses = [
        { id: 1, subject: 'Math', topic: 'Quadratic Equations', time: '10:00 AM', status: 'live' },
        { id: 2, subject: 'Physics', topic: 'Laws of Motion', time: '02:00 PM', status: 'upcoming' },
    ];

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#4c669f', '#3b5998', '#192f6a']}
                style={[styles.header, { paddingTop: insets.top + spacing.md }]}
            >
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('classroom.title')}</Text>
                    <TouchableOpacity style={styles.notificationButton}>
                        <Ionicons name="notifications-outline" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* Quick Stats or Welcome */}
                <View style={styles.welcomeParams}>
                    <Text style={styles.className}>{meta.className}</Text>
                    <Text style={styles.schoolName}>{meta.schoolName}</Text>
                </View>
            </LinearGradient>

            <View style={styles.contentContainer}>
                {/* Live Now Section */}
                {liveClasses.some(c => c.status === 'live') && (
                    <Animated.View entering={FadeInDown.delay(100)} style={styles.liveSection}>
                        <LinearGradient
                            colors={['#FF416C', '#FF4B2B']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.liveCard}
                        >
                            <View style={styles.liveBadge}>
                                <View style={styles.liveDot} />
                                <Text style={styles.liveText}>{t('classroom.liveNow')}</Text>
                            </View>
                            <Text style={styles.liveSubject}>{liveClasses.find(c => c.status === 'live')?.subject}</Text>
                            <Text style={styles.liveTopic}>{liveClasses.find(c => c.status === 'live')?.topic}</Text>
                            <TouchableOpacity style={styles.joinButton}>
                                <Text style={styles.joinButtonText}>{t('classroom.joinClass')}</Text>
                            </TouchableOpacity>
                        </LinearGradient>
                    </Animated.View>
                )}

                <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {/* Teachers Horizontal Scroll */}
                    <Text style={styles.sectionTitle}>{t('classroom.myTeachers')}</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.teachersRow}>
                        {meta.teachers.length > 0 ? (
                            meta.teachers.map((teacher, index) => (
                                <Animated.View key={teacher.id} entering={FadeInDown.delay(200 + index * 50)} style={styles.teacherCard}>
                                    <Image source={{ uri: teacher.avatar }} style={styles.teacherAvatar} />
                                    <Text style={styles.teacherName}>{teacher.name}</Text>
                                    <Text style={styles.teacherSubject}>{teacher.subject}</Text>
                                </Animated.View>
                            ))
                        ) : (
                            <Text style={{ color: '#666', marginLeft: 10, fontStyle: 'italic' }}>No teachers active yet.</Text>
                        )}
                    </ScrollView>

                    {/* Resources Section */}
                    <Text style={styles.sectionTitle}>Learning Resources</Text>
                    <View style={styles.resourcesRow}>
                        <TouchableOpacity
                            style={[styles.resourceCard, { backgroundColor: '#FFEBEE' }]}
                            onPress={() => navigation.navigate('VideoLibrary')}
                        >
                            <LinearGradient
                                colors={['#FF0000', '#CC0000']}
                                style={styles.resourceIcon}
                            >
                                <Ionicons name="logo-youtube" size={24} color="#fff" />
                            </LinearGradient>
                            <Text style={styles.resourceTitle}>YouTube Videos</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.resourceCard, { backgroundColor: '#E0F2F1' }]}
                            onPress={() => navigation.navigate('StudentOnlineAssignments')}
                        >
                            <LinearGradient
                                colors={['#11998e', '#38ef7d']}
                                style={styles.resourceIcon}
                            >
                                <Ionicons name="desktop-outline" size={24} color="#fff" />
                            </LinearGradient>
                            <Text style={styles.resourceTitle}>E-Learning</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Class Stream */}
                    <Text style={styles.sectionTitle}>Class Stream</Text>

                    {loading ? (
                        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 20 }} />
                    ) : classroomContent.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No content posted yet.</Text>
                        </View>
                    ) : (
                        classroomContent.map((item, index) => (
                            <Animated.View key={item.id} entering={FadeInDown.delay(300 + index * 100)} style={styles.streamCard}>
                                <TouchableOpacity onPress={() => handleItemPress(item)} activeOpacity={0.9}>
                                    <View style={styles.cardHeader}>
                                        <View style={[styles.iconContainer, { backgroundColor: item.type === 'quiz' ? '#E3F2FD' : '#E8F5E9' }]}>
                                            <MaterialCommunityIcons
                                                name={item.type === 'quiz' ? 'format-list-checks' : 'book-open-page-variant'}
                                                size={24}
                                                color={item.type === 'quiz' ? '#1976D2' : '#2E7D32'}
                                            />
                                        </View>
                                        <View style={styles.cardInfo}>
                                            <Text style={styles.cardTitle}>{item.title}</Text>
                                            <Text style={styles.cardSubtitle}>{item.subtitle} • {item.teacher}</Text>
                                            <Text style={styles.cardDate}>{new Date(item.date).toLocaleDateString()}</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.cardDescription} numberOfLines={3}>{item.description}</Text>
                                    <View style={styles.cardFooter}>
                                        <Text style={styles.actionText}>
                                            {item.type === 'quiz' ? 'Take Quiz' : 'Read Chapter'}
                                        </Text>
                                        <MaterialCommunityIcons name="arrow-right" size={16} color={theme.colors.primary} />
                                    </View>
                                </TouchableOpacity>
                            </Animated.View>
                        ))
                    )}

                    <View style={{ height: 100 }} />
                </ScrollView>
            </View>

            {/* Chapter Viewer Modal */}
            <Modal visible={!!selectedChapter} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelectedChapter(null)}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setSelectedChapter(null)} style={styles.closeButton}>
                            <MaterialCommunityIcons name="close" size={24} color="#333" />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle} numberOfLines={1}>{selectedChapter?.title}</Text>
                        <View style={{ width: 40 }} />
                    </View>
                    <NativeScrollView contentContainerStyle={styles.modalContent}>
                        <Text style={styles.contentTitle}>{selectedChapter?.title}</Text>
                        <Text style={styles.contentMeta}>{selectedChapter?.subtitle} • By {selectedChapter?.teacher}</Text>
                        <View style={styles.divider} />
                        <Text style={styles.contentText}>{selectedChapter?.fullContent || selectedChapter?.description}</Text>
                    </NativeScrollView>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    header: {
        paddingBottom: spacing.xl * 1.5,
        paddingHorizontal: spacing.lg,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    backButton: {
        padding: spacing.xs,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    notificationButton: {
        padding: spacing.xs,
    },
    welcomeParams: {
        alignItems: 'center',
    },
    className: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    schoolName: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
    },
    contentContainer: {
        flex: 1,
        marginTop: -40,
        paddingHorizontal: spacing.lg,
    },
    liveSection: {
        marginBottom: spacing.lg,
    },
    liveCard: {
        padding: spacing.lg,
        borderRadius: 20,
        elevation: 5,
        shadowColor: '#FF4B2B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    liveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: spacing.sm,
    },
    liveDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#fff',
        marginRight: 6,
    },
    liveText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 10,
    },
    liveSubject: {
        color: '#fff',
        fontSize: 14,
        opacity: 0.9,
        marginBottom: 2,
    },
    liveTopic: {
        color: '#fff',
        fontSize: 22,
        fontWeight: 'bold',
        marginTop: spacing.sm,
        marginBottom: spacing.md,
    },
    joinButton: {
        backgroundColor: '#fff',
        paddingVertical: 10,
        borderRadius: 12,
        alignItems: 'center',
    },
    joinButtonText: {
        color: '#FF4B2B',
        fontWeight: 'bold',
        fontSize: 14,
    },
    scrollContent: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginTop: spacing.md,
        marginBottom: spacing.md,
    },
    teachersRow: {
        marginBottom: spacing.md,
    },
    // Resource Styles
    resourcesRow: {
        flexDirection: 'row',
        marginBottom: spacing.lg,
        paddingHorizontal: spacing.xs,
    },
    resourceCard: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: 16,
        marginRight: spacing.md,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    resourceIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.sm,
    },
    resourceTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
    },
    teacherCard: {
        backgroundColor: '#fff',
        padding: spacing.md,
        borderRadius: 16,
        alignItems: 'center',
        marginRight: spacing.md,
        width: 120,
        elevation: 2,
    },
    teacherAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginBottom: spacing.sm,
        backgroundColor: '#eee',
    },
    teacherName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
    },
    teacherSubject: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
    announcementCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: spacing.lg,
        marginBottom: spacing.md,
        elevation: 2,
    },
    announcementHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.sm,
    },
    announcementAuthor: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.sm,
    },
    authorName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    dateText: {
        fontSize: 12,
        color: '#999',
    },
    highPriorityBadge: {
        backgroundColor: '#FFEBEE',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    priorityText: {
        fontSize: 10,
        color: '#D32F2F',
        fontWeight: 'bold',
    },
    announcementContent: {
        fontSize: 14,
        color: '#444',
        lineHeight: 20,
    },
    streamCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: spacing.md,
        marginBottom: spacing.md,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        marginBottom: spacing.sm,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    cardInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 2,
    },
    cardSubtitle: {
        fontSize: 12,
        color: '#666',
        marginBottom: 2,
    },
    cardDate: {
        fontSize: 10,
        color: '#999',
    },
    cardDescription: {
        fontSize: 14,
        color: '#444',
        lineHeight: 20,
        marginBottom: spacing.md,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: spacing.sm,
    },
    actionText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: theme.colors.primary,
    },
    emptyState: {
        padding: spacing.xl,
        alignItems: 'center',
    },
    emptyText: {
        color: '#666',
        fontSize: 16,
    },
    // Modal Styles
    modalContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        backgroundColor: '#fff',
    },
    closeButton: {
        padding: spacing.sm,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
        textAlign: 'center',
    },
    modalContent: {
        padding: spacing.lg,
        paddingBottom: 40,
    },
    contentTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: spacing.xs,
    },
    contentMeta: {
        fontSize: 14,
        color: '#666',
        marginBottom: spacing.lg,
    },
    divider: {
        height: 1,
        backgroundColor: '#eee',
        marginBottom: spacing.lg,
    },
    contentText: {
        fontSize: 16,
        color: '#333',
        lineHeight: 24,
    },
});

export default ClassroomScreen;
