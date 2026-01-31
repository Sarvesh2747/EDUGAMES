import React, { useState, useEffect } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { View, StyleSheet, ScrollView, TouchableOpacity, FlatList, Dimensions, StatusBar, Platform } from 'react-native';
import { Text, useTheme, Avatar, ProgressBar, Surface, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight, FadeIn } from 'react-native-reanimated';
import UserGreetingCard from '../../components/UserGreetingCard';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';
import { learnService } from '../../services/learnService';
import { progressService } from '../../services/progressService';
import { spacing, gradients, borderRadius } from '../../theme';
import { useResponsive } from '../../hooks/useResponsive';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import UnifiedHeader from '../../components/UnifiedHeader';
import ScreenBackground from '../../components/ScreenBackground';

const { width } = Dimensions.get('window');

const LearnDashboardScreen = ({ navigation }: any) => {
    const theme = useTheme();
    const { isDark } = useAppTheme();
    const insets = useSafeAreaInsets();
    const { user, xp, streak } = useAuth();
    const { isMobile } = useResponsive();

    // Desktop version continues below
    const [subjects, setSubjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedClass, setSelectedClass] = useState<number | null>(user?.selectedClass || null);
    const [filter, setFilter] = useState('All');

    const styles = createStyles(isDark);

    const isFocused = useIsFocused();

    useEffect(() => {
        if (user?.selectedClass) {
            setSelectedClass(user.selectedClass);
        }
    }, [user?.selectedClass]);

    useEffect(() => {
        if (selectedClass && isFocused) {
            loadSubjects();
        }
    }, [selectedClass, isFocused]);

    const loadSubjects = async () => {
        if (!selectedClass) return;

        setLoading(true);
        try {
            const classesData = await learnService.getClasses();
            if (!classesData || !Array.isArray(classesData)) {
                console.error('classesData is not an array:', classesData);
                setSubjects([]);
                return;
            }
            const currentClassData = classesData.find((c: any) => c.classNumber === selectedClass);

            if (currentClassData) {
                const subjectsData = await learnService.getSubjects(currentClassData._id);

                // Load progress for each subject
                const subjectsWithProgress = await Promise.all(subjectsData.map(async (subject: any) => {
                    try {
                        const chapters = await learnService.getChapters(subject._id);
                        const chapterIds = chapters.map((ch: any) => ch._id);
                        // Fix: Use getSubjectProgress instead of calculateSubjectProgress
                        const progressData = await progressService.getSubjectProgress(
                            subject._id,
                            `class-${selectedClass}`,
                            chapterIds.length
                        );
                        return { ...subject, progress: progressData.progress / 100 }; // Convert 0-100 to 0-1
                    } catch (e) {
                        return { ...subject, progress: 0 };
                    }
                }));

                setSubjects(subjectsWithProgress);
            } else {
                setSubjects([]);
            }
        } catch (error) {
            console.error(error);
            setSubjects([]);
        } finally {
            setLoading(false);
        }
    };

    const getSubjectGradient = (subjectName: string) => {
        const gradients: Record<string, string[]> = {
            'Mathematics': ['#f12711', '#f5af19'],      // Red-Orange
            'Science': ['#11998e', '#38ef7d'],          // Teal-Green
            'English': ['#4A00E0', '#8E2DE2'],          // Deep Purple
            'Social Studies': ['#4e4376', '#2b5876'],   // Tech Blue
            'Hindi': ['#ec008c', '#fc6767'],            // Pink-Red
            'Computer Science': ['#00d2ff', '#3a7bd5'], // Cyan-Blue
        };
        // Default gradient for unknown subjects
        return gradients[subjectName] || ['#607D8B', '#90A4AE'];
    };





    const renderSubjectItem = ({ item, index }: any) => {
        const displayTitle = item.name;
        const displayIcon = item.icon || 'book-open-variant';
        const progress = item.progress || 0;
        const gradient = getSubjectGradient(item.name);

        const handlePress = () => {
            navigation.navigate('ChapterList', { subjectId: item._id, subjectName: item.name });
        };

        return (
            <Animated.View
                entering={Platform.OS === 'web' ? undefined : FadeInDown.delay(index * 80).duration(600).springify()}
                style={styles.subjectCardWrapper}
            >
                <TouchableOpacity
                    onPress={handlePress}
                    activeOpacity={0.9}
                    style={styles.subjectCard}
                >
                    <LinearGradient
                        colors={isDark ? ['#1E293B', '#1E293B'] : ['#EEF2FF', '#EEF2FF']}
                        style={styles.subjectCardContent}
                    >
                        {/* Icon with gradient background */}
                        <LinearGradient
                            colors={gradient as any}
                            style={styles.iconBox}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <MaterialCommunityIcons name={displayIcon} size={36} color="#fff" />
                        </LinearGradient>

                        {/* Subject Info */}
                        <View style={styles.subjectInfo}>
                            <Text variant="titleLarge" style={styles.subjectName}>{displayTitle}</Text>
                            <View style={styles.statsRow}>
                                <View style={styles.statItem}>
                                    <MaterialCommunityIcons name="book-open-outline" size={16} color={isDark ? '#94A3B8' : '#6B7280'} />
                                    <Text style={styles.statText}>8 Chapters</Text>
                                </View>
                                <View style={styles.statDivider} />
                                <View style={styles.statItem}>
                                    <MaterialCommunityIcons name="progress-check" size={16} color={gradient[0]} />
                                    <Text style={[styles.statText, { color: gradient[0] }]}>{Math.round(progress * 100)}% Done</Text>
                                </View>
                            </View>
                        </View>

                        {/* Chevron */}
                        <View style={styles.chevronContainer}>
                            <MaterialCommunityIcons name="chevron-right" size={24} color={isDark ? '#475569' : '#CBD5E1'} />
                        </View>
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    // If no class selected, show prompt
    if (!selectedClass) {
        return (
            <ScreenBackground style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="#6A5AE0" />
                <LinearGradient
                    colors={['#6366F1', '#4F46E5']}
                    style={[styles.headerBackground, { paddingTop: insets.top + spacing.lg, paddingBottom: 40 }]}
                >
                    <View style={styles.modernHeader}>
                        <Text variant="headlineLarge" style={styles.modernTitle}>Learn</Text>
                        <Text variant="bodyMedium" style={styles.modernSubtitle}>Select your class to begin</Text>
                    </View>
                </LinearGradient>

                <View style={[styles.contentContainer, { justifyContent: 'center', alignItems: 'center', padding: spacing.xl }]}>
                    <MaterialCommunityIcons name="school-outline" size={80} color={isDark ? '#475569' : '#CBD5E1'} />
                    <Text variant="headlineSmall" style={{ marginTop: spacing.lg, textAlign: 'center', fontWeight: 'bold', color: isDark ? '#F1F5F9' : '#1A1A1A' }}>
                        Select Your Class
                    </Text>
                    <Text variant="bodyLarge" style={{ marginTop: spacing.sm, textAlign: 'center', color: isDark ? '#94A3B8' : '#64748B', marginBottom: spacing.xl }}>
                        Please select your class in your profile to see relevant subjects and content.
                    </Text>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Profile')}
                        style={{
                            backgroundColor: '#6A5AE0',
                            paddingHorizontal: spacing.xl,
                            paddingVertical: spacing.md,
                            borderRadius: 12,
                            elevation: 4,
                            shadowColor: '#6A5AE0',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.3,
                            shadowRadius: 8,
                        }}
                    >
                        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Go to Profile</Text>
                    </TouchableOpacity>
                </View>
            </ScreenBackground>
        );
    }

    return (
        <ScreenBackground style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#6A5AE0" />

            {/* Content Area */}
            <View style={styles.contentContainer}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
                >
                    {/* Unified Header */}
                    <UnifiedHeader
                        title="My Subjects"
                        subtitle={`Class ${selectedClass}`}
                        icon="book-open-page-variant"
                    />

                    {/* Content Area with Overlap */}
                    <View style={[styles.contentContainer, { marginTop: spacing.max }]}>









                        {/* Subjects Grid */}
                        <View style={styles.gridContainer}>
                            {subjects.map((item, index) => {
                                const displayTitle = item.name;
                                const displayIcon = item.icon || 'book-open-variant';
                                const progress = item.progress || 0;
                                const gradient = getSubjectGradient(item.name);

                                const handlePress = () => {
                                    navigation.navigate('ChapterList', { subjectId: item._id, subjectName: item.name });
                                };

                                return (
                                    <Animated.View
                                        key={item._id}
                                        entering={Platform.OS === 'web' ? undefined : FadeInDown.delay(index * 80).duration(600).springify()}
                                        style={[styles.subjectCardWrapper, { width: isMobile ? '48%' : '48%' }]}
                                    >
                                        <TouchableOpacity
                                            onPress={handlePress}
                                            activeOpacity={0.9}
                                            style={styles.subjectCard}
                                        >
                                            <LinearGradient
                                                colors={isDark ? ['#1E293B', '#1E293B'] : ['#EEF2FF', '#EEF2FF']}
                                                style={[
                                                    styles.subjectCardContent,
                                                    isMobile && {
                                                        flexDirection: 'column',
                                                        padding: 12,
                                                        height: 160,
                                                        justifyContent: 'center'
                                                    }
                                                ]}
                                            >
                                                {/* Icon with gradient background */}
                                                <LinearGradient
                                                    colors={gradient as any}
                                                    style={[
                                                        styles.iconBox,
                                                        isMobile && {
                                                            width: 48,
                                                            height: 48,
                                                            marginRight: 0,
                                                            marginBottom: 12,
                                                            borderRadius: 14
                                                        }
                                                    ]}
                                                    start={{ x: 0, y: 0 }}
                                                    end={{ x: 1, y: 1 }}
                                                >
                                                    <MaterialCommunityIcons name={displayIcon} size={isMobile ? 24 : 36} color="#fff" />
                                                </LinearGradient>

                                                {/* Subject Info */}
                                                <View style={[styles.subjectInfo, isMobile && { alignItems: 'center', width: '100%' }]}>
                                                    <Text
                                                        variant="titleLarge"
                                                        style={[
                                                            styles.subjectName,
                                                            isMobile && {
                                                                fontSize: 14,
                                                                textAlign: 'center',
                                                                marginBottom: 4
                                                            }
                                                        ]}
                                                        numberOfLines={1}
                                                    >
                                                        {displayTitle}
                                                    </Text>

                                                    {!isMobile && (
                                                        <View style={styles.statsRow}>
                                                            <View style={styles.statItem}>
                                                                <MaterialCommunityIcons name="book-open-outline" size={16} color={isDark ? '#94A3B8' : '#6B7280'} />
                                                                <Text style={styles.statText}>8 Chapters</Text>
                                                            </View>
                                                            <View style={styles.statDivider} />
                                                            <View style={styles.statItem}>
                                                                <MaterialCommunityIcons name="progress-check" size={16} color={gradient[0]} />
                                                                <Text style={[styles.statText, { color: gradient[0] }]}>{Math.round(progress * 100)}% Done</Text>
                                                            </View>
                                                        </View>
                                                    )}

                                                    {isMobile && (
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                                            <MaterialCommunityIcons name="progress-check" size={12} color={gradient[0]} />
                                                            <Text style={{ fontSize: 10, color: gradient[0], fontWeight: '700' }}>{Math.round(progress * 100)}%</Text>
                                                        </View>
                                                    )}
                                                </View>

                                                {/* Chevron - Hide on Mobile Bento */}
                                                {!isMobile && (
                                                    <View style={styles.chevronContainer}>
                                                        <MaterialCommunityIcons name="chevron-right" size={24} color={isDark ? '#475569' : '#CBD5E1'} />
                                                    </View>
                                                )}
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    </Animated.View>
                                );
                            })}
                        </View>
                    </View>
                </ScrollView>
            </View>
        </ScreenBackground>
    );
};

const createStyles = (isDark: boolean) => StyleSheet.create({
    container: {
        flex: 1,
        // backgroundColor: isDark ? '#0F172A' : '#F8FAFC', // Handled by ScreenBackground
    },
    headerBackground: {
        paddingBottom: spacing.xxl + 12,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
        elevation: 10,
    },
    modernHeader: {
        paddingHorizontal: spacing.xl,
        paddingBottom: spacing.xl,
        maxWidth: 1000,
        width: '100%',
        alignSelf: 'center',
    },
    modernTitle: {
        fontWeight: '800',
        color: '#fff',
        fontSize: 32,
        letterSpacing: -1,
        marginBottom: spacing.xs - 2,
    },
    modernSubtitle: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 15,
        fontWeight: '500',
    },
    headerContainer: {
        paddingHorizontal: spacing.lg + 4,
        marginBottom: spacing.lg + 2,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: 1000,
        width: '100%',
        alignSelf: 'center',
    },
    headerContent: {
        paddingHorizontal: spacing.lg + 4,
        maxWidth: 1000,
        width: '100%',
        alignSelf: 'center',
    },
    contentContainer: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: spacing.xxl + 30,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 4,
    },
    avatarGradient: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    avatarText: {
        fontSize: 24,
        fontWeight: '800',
        color: '#fff',
    },
    userStats: {
        marginLeft: 12,
    },
    userName: {
        fontWeight: '800',
        color: '#fff',
        fontSize: 22,
        lineHeight: 28,
    },
    xpContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.25)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 14,
        marginTop: 6,
        alignSelf: 'flex-start',
    },
    xpText: {
        color: '#FFD700',
        fontWeight: '800',
        fontSize: 13,
        marginLeft: 4,
    },
    streakContainer: {
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.25)',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 18,
        flexDirection: 'row',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    streakText: {
        fontWeight: '800',
        color: '#fff',
        fontSize: 20,
        marginLeft: 6,
    },
    dailyGoalCard: {
        padding: spacing.lg + 2,
        borderRadius: 22,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 6,
        marginBottom: 2,
    },
    goalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md + 2,
    },
    goalTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    goalIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#EDE7FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    goalTitle: {
        fontWeight: '800',
        fontSize: 17,
        color: '#1A1A1A',
        letterSpacing: 0.2,
    },
    goalXP: {
        fontWeight: '700',
        color: '#666',
        fontSize: 15,
    },
    progressContainer: {
        marginBottom: spacing.sm + 2,
    },
    progressBar: {
        height: 14,
        borderRadius: 7,
        backgroundColor: '#F0F0F0',
    },
    goalMotivation: {
        color: '#888',
        fontSize: 13,
        fontWeight: '500',
        lineHeight: 18,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg + 4,
        marginBottom: spacing.md + 4,
        marginTop: spacing.lg,
        maxWidth: 1000,
        width: '100%',
        alignSelf: 'center',
    },
    sectionTitle: {
        fontWeight: '800',
        color: '#1A1A1A',
        fontSize: 23,
        letterSpacing: 0.3,
    },
    sectionSubtitle: {
        fontWeight: '700',
        color: '#1A1A1A',
        fontSize: 19,
        letterSpacing: 0.2,
        marginBottom: spacing.md,
        paddingHorizontal: spacing.lg + 4,
    },
    changeClassText: {
        color: '#6A5AE0',
        fontWeight: '700',
        fontSize: 14,
    },
    filtersContainer: {
        marginBottom: spacing.lg + 4,
    },
    filterChip: {
        paddingHorizontal: 20,
        paddingVertical: 11,
        marginRight: spacing.sm + 2,
        backgroundColor: '#fff',
        borderRadius: 22,
        borderWidth: 1.5,
        borderColor: '#E0E0E0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
        elevation: 2,
    },
    filterChipActive: {
        backgroundColor: '#6A5AE0',
        borderColor: '#6A5AE0',
        shadowColor: '#6A5AE0',
        shadowOpacity: 0.3,
    },
    filterChipText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        letterSpacing: 0.2,
    },
    filterChipTextActive: {
        color: '#fff',
        fontWeight: '700',
    },
    highlightsContainer: {
        marginBottom: spacing.lg + 4,
    },
    horizontalScroll: {
        paddingLeft: spacing.lg + 4,
        paddingTop: spacing.sm + 2,
    },
    highlightCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md + 2,
        borderRadius: 18,
        backgroundColor: '#fff',
        marginRight: spacing.md + 2,
        width: 210,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        marginBottom: 10,
    },
    highlightIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#FFF5F0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    highlightContent: {
        flex: 1,
    },
    highlightTitle: {
        fontWeight: '700',
        color: '#1A1A1A',
        fontSize: 15,
        marginBottom: 2,
    },
    highlightSubtitle: {
        color: '#888',
        fontSize: 13,
    },
    subjectCardWrapper: {
        marginBottom: spacing.lg,
        paddingHorizontal: spacing.xl,
    },
    subjectCard: {
        borderRadius: 20,
        shadowColor: isDark ? '#000' : '#1E293B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDark ? 0.5 : 0.08,
        shadowRadius: 12,
        elevation: 3,
    },
    subjectCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.xl,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: isDark ? '#334155' : '#E2E8F0',
    },
    iconBox: {
        width: 72,
        height: 72,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    subjectInfo: {
        flex: 1,
    },
    subjectName: {
        fontWeight: '800',
        marginBottom: spacing.sm + 2,
        fontSize: 19,
        color: isDark ? '#F8FAFC' : '#0F172A',
        letterSpacing: -0.5,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statText: {
        fontSize: 13,
        color: isDark ? '#94A3B8' : '#64748B',
        fontWeight: '600',
    },
    statDivider: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: isDark ? '#475569' : '#CBD5E1',
        marginHorizontal: spacing.sm,
    },
    progressRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    progressBarContainer: {
        flex: 1,
        marginRight: 12,
    },
    progressBarTrack: {
        height: 6,
        backgroundColor: isDark ? '#334155' : '#F3F4F6',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    miniProgressBar: {
        height: 7,
        borderRadius: 4,
        backgroundColor: '#F0F0F0',
    },
    progressText: {
        fontSize: 13,
        color: isDark ? '#94A3B8' : '#6B7280',
        fontWeight: '700',
        minWidth: 38,
        textAlign: 'right',
    },
    chevronContainer: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingBottom: spacing.xl,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.xl, // Match subjectCardWrapper padding
        maxWidth: 1000,
        width: '100%',
        alignSelf: 'center',
    },
    exploreContainer: {
        paddingHorizontal: spacing.lg + 4,
        marginBottom: spacing.lg + 4,
        maxWidth: 1000,
        width: '100%',
        alignSelf: 'center',
    },
    exploreCard: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    exploreGradient: {
        padding: spacing.lg,
    },
    exploreContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    exploreTextContainer: {
        flex: 1,
    },
    exploreTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#006064',
        marginBottom: 4,
    },
    exploreSubtitle: {
        fontSize: 14,
        color: '#00838F',
        fontWeight: '600',
    },
    exploreIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 16,
    },
});

export default LearnDashboardScreen;
