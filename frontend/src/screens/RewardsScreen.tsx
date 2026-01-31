import React from 'react';
import { View, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Platform } from 'react-native';
import { Text, useTheme, Surface, ProgressBar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import Animated, { FadeInDown, FadeInRight, ZoomIn, FadeIn } from 'react-native-reanimated';
import { spacing } from '../theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useResponsive } from '../hooks/useResponsive';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    unlocked: boolean;
    requiredXP: number;
    gradient: readonly [string, string];
}

const RewardsScreen = ({ navigation }: any) => {
    const { xp, streak } = useAuth();
    const { containerStyle } = useResponsive();
    const insets = useSafeAreaInsets();
    const { isDark } = useAppTheme();

    const level = Math.floor(xp / 100) + 1;
    const currentLevelXP = xp % 100;
    const nextLevelXP = 100;
    const progress = currentLevelXP / nextLevelXP;

    const badges: Badge[] = [
        // Beginner Achievements
        { id: '1', name: 'First Steps', description: 'Complete your first quiz', icon: 'star', unlocked: xp >= 10, requiredXP: 10, gradient: ['#6366F1', '#4F46E5'] },
        { id: '2', name: 'Curious Mind', description: 'Complete your first lesson', icon: 'book-open-variant', unlocked: xp >= 5, requiredXP: 5, gradient: ['#0EA5E9', '#0284C7'] },
        { id: '3', name: 'Quick Learner', description: 'Earn 100 XP', icon: 'flash', unlocked: xp >= 100, requiredXP: 100, gradient: ['#EC4899', '#BE185D'] },

        // Streak Achievements
        { id: '4', name: 'Dedicated', description: 'Maintain a 7-day streak', icon: 'fire', unlocked: streak >= 7, requiredXP: 0, gradient: ['#F59E0B', '#D97706'] },
        { id: '5', name: 'Unstoppable', description: 'Maintain a 30-day streak', icon: 'fire-circle', unlocked: streak >= 30, requiredXP: 0, gradient: ['#EF4444', '#DC2626'] },
        { id: '6', name: 'Legend', description: 'Maintain a 100-day streak', icon: 'crown', unlocked: streak >= 100, requiredXP: 0, gradient: ['#FBBF24', '#F59E0B'] },

        // Level Achievements
        { id: '7', name: 'Scholar', description: 'Reach Level 5', icon: 'school', unlocked: level >= 5, requiredXP: 500, gradient: ['#8B5CF6', '#7C3AED'] },
        { id: '8', name: 'Master', description: 'Reach Level 10', icon: 'medal', unlocked: level >= 10, requiredXP: 1000, gradient: ['#10B981', '#059669'] },
        { id: '9', name: 'Grandmaster', description: 'Reach Level 20', icon: 'trophy-award', unlocked: level >= 20, requiredXP: 2000, gradient: ['#6366F1', '#4338CA'] },

        // XP Milestones
        { id: '10', name: 'Rising Star', description: 'Earn 500 XP', icon: 'star-circle', unlocked: xp >= 500, requiredXP: 500, gradient: ['#14B8A6', '#0D9488'] },
        { id: '11', name: 'Expert', description: 'Earn 1000 XP', icon: 'trophy', unlocked: xp >= 1000, requiredXP: 1000, gradient: ['#F59E0B', '#B45309'] },
        { id: '12', name: 'Elite', description: 'Earn 5000 XP', icon: 'trophy-variant', unlocked: xp >= 5000, requiredXP: 5000, gradient: ['#8B5CF6', '#6D28D9'] },
    ];

    const unlockedBadges = badges.filter((b) => b.unlocked);
    const lockedBadges = badges.filter((b) => !b.unlocked);

    // Background Stars (Matches Home)
    const renderStars = () => {
        const stars = [];
        for (let i = 0; i < 40; i++) {
            stars.push(
                <View
                    key={i}
                    style={{
                        position: 'absolute',
                        backgroundColor: '#FFFFFF',
                        borderRadius: 50,
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        width: Math.random() * 3 + 1,
                        height: Math.random() * 3 + 1,
                        opacity: Math.random() * 0.5 + 0.1,
                    }}
                />
            );
        }
        return stars;
    };

    const styles = createStyles(isDark, insets);

    return (
        <View style={styles.container}>
            {/* Global Background */}
            <LinearGradient
                colors={isDark ? ['#0A1628', '#0F172A'] : ['#F0F9FF', '#E0F2FE']}
                style={[StyleSheet.absoluteFill, { zIndex: -1 }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />
            {isDark && <View style={styles.starsContainer}>{renderStars()}</View>}

            <ScrollView
                contentContainerStyle={[styles.content, containerStyle]}
                showsVerticalScrollIndicator={false}
            >
                {/* Premium Gradient Header */}
                <LinearGradient
                    colors={isDark ? ['#4338CA', '#312E81'] : ['#6366F1', '#4F46E5', '#4338CA']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.header}
                >
                    <View style={styles.headerContent}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Achievements</Text>
                        <View style={{ width: 44 }} />
                    </View>

                    <View style={styles.headerHero}>
                        <View style={styles.heroTextContainer}>
                            <Text style={styles.heroTitle}>Rewards & Progress</Text>
                            <Text style={styles.heroSubtitle}>Track your journey getting smarter!</Text>
                        </View>
                        <MaterialCommunityIcons name="trophy" size={80} color="rgba(255,255,255,0.2)" style={styles.heroIcon} />
                    </View>
                </LinearGradient>

                {/* Main Content Overlap */}
                <View style={styles.mainContainer}>

                    <View style={styles.statsRow}>
                        {/* Level Card (Wider) */}
                        <Animated.View style={{ flex: 1.5 }} entering={FadeInDown.delay(100).duration(600)}>
                            <Surface style={styles.levelCard} elevation={4}>
                                <LinearGradient
                                    colors={isDark ? ['#1E293B', '#334155'] : ['#fff', '#F8FAFC']}
                                    style={styles.cardGradient}
                                >
                                    <View style={styles.levelHeader}>
                                        <LinearGradient
                                            colors={['#8B5CF6', '#6D28D9']}
                                            style={styles.levelCircle}
                                        >
                                            <Text style={styles.levelNumber}>{level}</Text>
                                            <Text style={styles.levelLabel}>LVL</Text>
                                        </LinearGradient>
                                    </View>

                                    <View style={styles.levelInfo}>
                                        <View style={styles.progressBarContainer}>
                                            <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
                                        </View>
                                        <Text style={styles.xpText}>
                                            {currentLevelXP}/{nextLevelXP} XP
                                        </Text>
                                    </View>
                                </LinearGradient>
                            </Surface>
                        </Animated.View>

                        {/* Streak Card (Narrower) */}
                        <Animated.View style={{ flex: 1 }} entering={FadeInDown.delay(200).duration(600)}>
                            <Surface style={styles.streakCard} elevation={4}>
                                <LinearGradient
                                    colors={['#F59E0B', '#EA580C']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.streakGradient}
                                >
                                    <MaterialCommunityIcons name="fire" size={32} color="#fff" style={{ marginBottom: 4 }} />
                                    <Text style={styles.streakCount}>{streak}</Text>
                                    <Text style={styles.streakLabel}>Day Streak</Text>
                                </LinearGradient>
                            </Surface>
                        </Animated.View>
                    </View>

                    {/* Unlocked Badges */}
                    <View style={styles.sectionContainer}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Unlocked Badges</Text>
                            <View style={styles.badgeCount}>
                                <Text style={styles.badgeCountText}>{unlockedBadges.length}</Text>
                            </View>
                        </View>

                        {unlockedBadges.length === 0 ? (
                            <View style={styles.emptyState}>
                                <MaterialCommunityIcons name="trophy-outline" size={64} color={isDark ? '#475569' : '#CBD5E1'} />
                                <Text style={styles.emptyText}>Start learning to unlock badges!</Text>
                            </View>
                        ) : (
                            <View style={styles.badgesGrid}>
                                {unlockedBadges.map((badge, index) => (
                                    <Animated.View
                                        key={badge.id}
                                        entering={FadeInDown.delay(300 + index * 50)}
                                        style={styles.badgeWrapper}
                                    >
                                        <Surface style={styles.badgeCard} elevation={2}>
                                            <LinearGradient
                                                colors={badge.gradient}
                                                style={styles.badgeGradient}
                                            >
                                                <View style={styles.badgeIconBubble}>
                                                    <MaterialCommunityIcons name={badge.icon as any} size={32} color={badge.gradient[1]} />
                                                </View>
                                                <Text style={styles.badgeName}>{badge.name}</Text>
                                                <Text style={styles.badgeDesc} numberOfLines={2}>{badge.description}</Text>
                                            </LinearGradient>
                                        </Surface>
                                    </Animated.View>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Locked Badges */}
                    {lockedBadges.length > 0 && (
                        <View style={styles.sectionContainer}>
                            <Text style={[styles.sectionTitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>Locked Badges</Text>
                            <View style={styles.badgesGrid}>
                                {lockedBadges.map((badge, index) => (
                                    <Animated.View
                                        key={badge.id}
                                        entering={FadeInDown.delay(500 + index * 50)}
                                        style={styles.badgeWrapper}
                                    >
                                        <Surface style={[styles.badgeCard, styles.lockedCard]} elevation={0}>
                                            <View style={styles.lockedIconBubble}>
                                                <MaterialCommunityIcons name="lock" size={24} color={isDark ? '#64748B' : '#94A3B8'} />
                                            </View>
                                            <Text style={styles.lockedName}>{badge.name}</Text>
                                            <Text style={styles.lockedDesc}>{badge.description}</Text>
                                            {badge.requiredXP > 0 && (
                                                <View style={styles.xpTag}>
                                                    <Text style={styles.xpTagText}>{badge.requiredXP} XP</Text>
                                                </View>
                                            )}
                                        </Surface>
                                    </Animated.View>
                                ))}
                            </View>
                        </View>
                    )}

                </View>
                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

const createStyles = (isDark: boolean, insets: any) => StyleSheet.create({
    container: {
        flex: 1,
    },
    starsContainer: {
        ...StyleSheet.absoluteFillObject,
        zIndex: -1,
    },
    content: {
        flexGrow: 1,
        paddingBottom: 40,
    },
    header: {
        paddingTop: insets.top + spacing.md,
        paddingBottom: 80, // Space for overlap
        paddingHorizontal: spacing.lg,
        borderBottomLeftRadius: 36,
        borderBottomRightRadius: 36,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.lg,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
    },
    headerHero: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    heroTextContainer: {
        flex: 1,
    },
    heroTitle: {
        fontSize: 32,
        fontWeight: '900',
        color: '#fff',
        marginBottom: 4,
    },
    heroSubtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '500',
    },
    heroIcon: {
        transform: [{ rotate: '15deg' }]
    },
    mainContainer: {
        marginTop: -50,
        paddingHorizontal: spacing.lg,
    },
    statsRow: {
        flexDirection: 'row',
        gap: spacing.md,
        marginBottom: spacing.xl,
    },
    levelCard: {
        borderRadius: 24,
        overflow: 'hidden',
        height: '100%',
    },
    cardGradient: {
        padding: spacing.lg,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    levelHeader: {
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    levelCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    levelNumber: {
        fontSize: 24,
        fontWeight: '900',
        color: '#fff',
        lineHeight: 28,
    },
    levelLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.9)',
    },
    levelInfo: {
        width: '100%',
    },
    progressBarContainer: {
        height: 6,
        backgroundColor: isDark ? '#334155' : '#E2E8F0',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 4,
        marginTop: 8,
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#8B5CF6',
        borderRadius: 4,
    },
    xpText: {
        fontSize: 11,
        color: isDark ? '#94A3B8' : '#64748B',
        fontWeight: '600',
        textAlign: 'center',
    },
    streakCard: {
        borderRadius: 24,
        overflow: 'hidden',
        height: '100%',
    },
    streakGradient: {
        padding: spacing.lg,
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
    },
    streakCount: {
        fontSize: 24,
        fontWeight: '900',
        color: '#fff',
        marginBottom: 2,
    },
    streakLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.95)',
        fontWeight: '700',
        textAlign: 'center',
    },
    sectionContainer: {
        marginBottom: spacing.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
        gap: spacing.sm,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: isDark ? '#F1F5F9' : '#1E293B',
    },
    badgeCount: {
        backgroundColor: '#6366F1',
        paddingHorizontal: 10,
        paddingVertical: 2,
        borderRadius: 12,
    },
    badgeCountText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    badgesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: spacing.md,
    },
    badgeWrapper: {
        width: '48%',
    },
    badgeCard: {
        borderRadius: 20,
        overflow: 'hidden',
        minHeight: 160,
    },
    badgeGradient: {
        flex: 1,
        padding: spacing.lg,
        alignItems: 'flex-start',
    },
    badgeIconBubble: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    badgeName: {
        fontSize: 16,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 4,
    },
    badgeDesc: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.9)',
        lineHeight: 16,
    },
    lockedCard: {
        backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: isDark ? '#334155' : '#E2E8F0',
        borderStyle: 'dashed',
    },
    lockedIconBubble: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: isDark ? '#334155' : '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    lockedName: {
        fontSize: 16,
        fontWeight: '700',
        color: isDark ? '#64748B' : '#94A3B8',
        marginBottom: 4,
    },
    lockedDesc: {
        fontSize: 12,
        color: isDark ? '#475569' : '#94A3B8',
    },
    xpTag: {
        alignSelf: 'flex-start',
        backgroundColor: isDark ? '#334155' : '#E2E8F0',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        marginTop: 12,
    },
    xpTagText: {
        fontSize: 10,
        fontWeight: '700',
        color: isDark ? '#94A3B8' : '#64748B',
    },
    emptyState: {
        alignItems: 'center',
        padding: spacing.xxl,
        borderWidth: 2,
        borderColor: isDark ? '#334155' : '#E2E8F0',
        borderStyle: 'dashed',
        borderRadius: 24,
    },
    emptyText: {
        color: isDark ? '#64748B' : '#94A3B8',
        marginTop: spacing.md,
        fontWeight: '600',
    },
});

export default RewardsScreen;
