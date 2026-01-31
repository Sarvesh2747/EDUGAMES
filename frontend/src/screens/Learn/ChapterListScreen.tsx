import React, { useEffect, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { View, StyleSheet, FlatList, TouchableOpacity, Platform, StatusBar, Pressable } from 'react-native';
import { Text, useTheme, ActivityIndicator, ProgressBar, Surface } from 'react-native-paper';
import { learnService } from '../../services/learnService';
import { progressService } from '../../services/progressService';
import { spacing } from '../../theme';
import Animated, { FadeInDown, FadeIn, Layout, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const ScaleButton = ({ onPress, style, children, ...props }: any) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }]
    }));

    const onPressIn = () => {
        scale.value = withSpring(0.98);
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

const ChapterListScreen = ({ route, navigation }: any) => {
    const { subjectId, subjectName } = route.params;
    const theme = useTheme();
    const { isDark } = useAppTheme();
    const insets = useSafeAreaInsets();
    const [chapters, setChapters] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const isFocused = useIsFocused();
    const styles = createStyles(isDark);

    useEffect(() => {
        if (isFocused) {
            loadChapters();
        }
    }, [isFocused]);

    const loadChapters = async () => {
        try {
            const data = await learnService.getChapters(subjectId);
            // Fetch subchapters for each chapter to show preview
            const chaptersWithSub = await Promise.all(data.map(async (chapter: any) => {
                try {
                    const subchapters = await learnService.getSubchapters(chapter._id);
                    return { ...chapter, subchapters };
                } catch (e) {
                    return { ...chapter, subchapters: [] };
                }
            }));
            setChapters(chaptersWithSub);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Starry background component
    const renderStars = () => {
        const stars = [];
        for (let i = 0; i < 60; i++) {
            stars.push(
                <View
                    key={i}
                    style={[
                        styles.star,
                        {
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            width: Math.random() * 2 + 1,
                            height: Math.random() * 2 + 1,
                            opacity: Math.random() * 0.7 + 0.3,
                        },
                    ]}
                />
            );
        }
        return stars;
    };

    const ChapterCard = ({ item, index }: { item: any; index: number }) => {
        const [progress, setProgress] = useState<number>(0);
        const topicCount = item.subchapters?.length || 0;

        // Load progress for this chapter
        useEffect(() => {
            const loadProgress = async () => {
                const chapterProgress = await progressService.getChapterProgress(item._id);
                setProgress(chapterProgress?.completed ? 1 : 0);
            };
            loadProgress();
        }, [item._id]);

        return (
            <Animated.View entering={Platform.OS === 'web' ? undefined : FadeInDown.delay(index * 80).duration(500)} layout={Layout.springify()}>
                <ScaleButton
                    onPress={() => {
                        if (item.subchapters && item.subchapters.length > 0) {
                            navigation.navigate('Subchapter', { subchapterId: item.subchapters[0]._id });
                        }
                    }}
                    style={{ marginBottom: spacing.md }}
                >
                    <Surface style={styles.chapterCard} elevation={2}>
                        {/* Left Side: Number Circle */}
                        <View style={styles.numberContainer}>
                            <LinearGradient
                                colors={progress === 1
                                    ? ['#10B981', '#059669'] // Green if done
                                    : ['#6366F1', '#8B5CF6']} // Violet/Purple default
                                style={styles.numberGradient}
                            >
                                <Text style={styles.chapterNumber}>{index + 1}</Text>
                            </LinearGradient>
                        </View>

                        {/* Middle: Content */}
                        <View style={styles.chapterContent}>
                            <Text variant="titleMedium" style={styles.chapterTitle} numberOfLines={2}>
                                {item.name}
                            </Text>

                            <View style={styles.metaRow}>
                                <MaterialCommunityIcons name="book-open-page-variant" size={14} color={isDark ? '#94A3B8' : '#64748B'} />
                                <Text style={styles.metaText}>{topicCount} Topics</Text>
                            </View>

                            <View style={styles.progressSection}>
                                <View style={styles.progressInfo}>
                                    <Text style={styles.progressLabel}>Progress</Text>
                                    <Text style={[styles.progressPercent, progress === 1 && { color: '#10B981' }]}>
                                        {Math.round(progress * 100)}%
                                    </Text>
                                </View>
                                <ProgressBar
                                    progress={progress}
                                    color={progress === 1 ? '#10B981' : '#6366F1'}
                                    style={styles.progressBar}
                                />
                            </View>

                            {/* Actions Row */}
                            <View style={styles.actionRow}>
                                {/* Read Button */}
                                <TouchableOpacity
                                    style={styles.readButton}
                                    onPress={async (e) => {
                                        e.stopPropagation();

                                        // Special case for Gravity Topic Map
                                        if (item.name === 'Gravitation') {
                                            navigation.navigate('GravityMap');
                                            return;
                                        }
                                        // Special case for Current Electricity Topic Map
                                        if (item.name === 'Current Electricity') {
                                            navigation.navigate('ElectricityMap');
                                            return;
                                        }

                                        try {
                                            const chapterContent = await learnService.getChapterContent(item._id);
                                            navigation.navigate('LessonReader', {
                                                title: item.name,
                                                content: chapterContent.combinedContent,
                                                xpReward: 20,
                                                chapterId: item._id,
                                                subjectId: subjectId,
                                                classId: route.params.classId || 'class-6',
                                            });
                                        } catch (error) {
                                            console.error('Error loading chapter content:', error);
                                        }
                                    }}
                                >
                                    <MaterialCommunityIcons name="book-open-variant" size={16} color="#6366F1" />
                                    <Text style={styles.readButtonText}>Read</Text>
                                </TouchableOpacity>

                                {/* Start/Continue Button */}
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={() => {
                                        if (item.subchapters && item.subchapters.length > 0) {
                                            navigation.navigate('Subchapter', { subchapterId: item.subchapters[0]._id });
                                        }
                                    }}
                                >
                                    <LinearGradient
                                        colors={['#6366F1', '#4F46E5']}
                                        style={styles.actionButtonGradient}
                                    >
                                        <Text style={styles.actionButtonText}>
                                            {progress > 0 ? 'Continue' : 'Start'}
                                        </Text>
                                        <MaterialCommunityIcons name="arrow-right" size={16} color="#fff" />
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Surface>
                </ScaleButton>
            </Animated.View>
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <LinearGradient
                    colors={isDark ? ['#0A1628', '#0F172A', '#1E293B'] : ['#F0F9FF', '#E0F2FE', '#BAE6FD']}
                    style={StyleSheet.absoluteFill}
                />
                <ActivityIndicator size="large" color="#6366F1" />
                <Text style={{ marginTop: 16, color: isDark ? '#fff' : '#333' }}>Loading chapters...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Background */}
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

            {/* Header */}
            <LinearGradient
                colors={isDark ? ['#6366F1', '#4F46E5'] : ['#6366F1', '#8B5CF6']}
                style={[styles.headerBackground, { paddingTop: insets.top + spacing.md }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitle}>{subjectName}</Text>
                        <Text style={styles.headerSubtitle}>
                            {chapters.length} Chapter{chapters.length !== 1 ? 's' : ''}
                        </Text>
                    </View>
                    <View style={{ width: 40 }} />
                </View>
            </LinearGradient>

            {/* Content */}
            <View style={styles.contentContainer}>
                {/* Info Card */}
                <Animated.View entering={FadeIn.delay(200)} style={styles.infoCardWrapper}>
                    <Surface style={styles.infoCard} elevation={2}>
                        <View style={styles.infoIconBox}>
                            <MaterialCommunityIcons name="lightbulb-on" size={24} color="#F59E0B" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.infoTitle}>Learn at Your Pace</Text>
                            <Text style={styles.infoText}>
                                Complete chapters to unlock achievements and earn XP!
                            </Text>
                        </View>
                    </Surface>
                </Animated.View>

                {/* Chapters List */}
                <FlatList
                    data={chapters}
                    renderItem={({ item, index }) => <ChapterCard item={item} index={index} />}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <MaterialCommunityIcons name="book-open-page-variant-outline" size={64} color="#94A3B8" />
                            <Text style={styles.emptyText}>No chapters available for this subject yet.</Text>
                        </View>
                    }
                />
            </View>
        </View>
    );
};

const createStyles = (isDark: boolean) => StyleSheet.create({
    container: {
        flex: 1,
    },
    starsContainer: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 0,
    },
    star: {
        position: 'absolute',
        backgroundColor: '#FFFFFF',
        borderRadius: 50,
    },
    headerBackground: {
        paddingBottom: 50, // More bottom padding for content overlap
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        paddingHorizontal: spacing.lg,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        zIndex: 10,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitleContainer: {
        alignItems: 'center',
    },
    headerTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '800',
    },
    headerSubtitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        fontWeight: '600',
        marginTop: 2,
    },
    contentContainer: {
        flex: 1,
        marginTop: -30, // Overlap header
    },
    infoCardWrapper: {
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.lg,
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        backgroundColor: isDark ? '#1E293B' : '#fff',
        gap: 16,
    },
    infoIconBox: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#FFF7ED', // Light Orange
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: isDark ? '#F1F5F9' : '#1A1A1A',
        marginBottom: 2,
    },
    infoText: {
        fontSize: 12,
        color: isDark ? '#94A3B8' : '#64748B',
        lineHeight: 18,
    },
    listContent: {
        paddingHorizontal: spacing.lg,
        paddingBottom: 100,
        gap: spacing.sm, // Gap handled by marginBottom in item
    },
    chapterCard: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 24,
        backgroundColor: isDark ? '#1E293B' : '#fff',
    },
    numberContainer: {
        marginRight: 16,
    },
    numberGradient: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    chapterNumber: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '800',
    },
    chapterContent: {
        flex: 1,
    },
    chapterTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: isDark ? '#F1F5F9' : '#1A1A1A',
        marginBottom: 8,
        lineHeight: 22,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 12,
    },
    metaText: {
        fontSize: 12,
        color: isDark ? '#94A3B8' : '#64748B',
        fontWeight: '600',
    },
    progressSection: {
        marginBottom: 16,
    },
    progressInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    progressLabel: {
        fontSize: 11,
        color: isDark ? '#94A3B8' : '#888',
        fontWeight: '600',
    },
    progressPercent: {
        fontSize: 11,
        color: '#6366F1',
        fontWeight: '700',
    },
    progressBar: {
        height: 6,
        borderRadius: 3,
        backgroundColor: isDark ? '#334155' : '#F1F5F9',
    },
    actionRow: {
        flexDirection: 'row',
        gap: 12,
    },
    readButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 14,
        backgroundColor: isDark ? 'rgba(99, 102, 241, 0.1)' : '#EEF2FF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    readButtonText: {
        color: '#6366F1',
        fontWeight: '700',
        fontSize: 14,
    },
    actionButton: {
        flex: 1.5,
        borderRadius: 14,
        overflow: 'hidden',
    },
    actionButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        gap: 6,
    },
    actionButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        gap: 16,
    },
    emptyText: {
        fontSize: 16,
        color: '#94A3B8',
        fontWeight: '500',
        textAlign: 'center',
    },
});

export default ChapterListScreen;
