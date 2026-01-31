import React, { useMemo, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Dimensions } from 'react-native';
import { Text, Surface, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useResponsive } from '../hooks/useResponsive';
import { useAppTheme } from '../context/ThemeContext';
import Animated, { FadeInDown, FadeInRight, FadeInUp } from 'react-native-reanimated';
import { spacing } from '../theme';
import { LinearGradient } from 'expo-linear-gradient';
import UnifiedHeader from '../components/UnifiedHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getUserGameStats } from '../services/gamesService';
import { formatTime } from '../hooks/useGameTimer';
import ScreenBackground from '../components/ScreenBackground';

const { width } = Dimensions.get('window');

type GameCategory = 'Science' | 'Math' | 'Logic';

interface GameItem {
    id: number;
    title: string;
    description: string;
    icon: string;
    color: string;
    gradient: readonly [string, string];
    route: string;
    category: GameCategory;
    isNew?: boolean;
    isPopular?: boolean;
    params?: any;
    gameId?: string; // Add gameId mapping for stats
}

const GamesScreen = ({ navigation }: any) => {
    const { isDark } = useAppTheme();
    const insets = useSafeAreaInsets();
    const { isMobile } = useResponsive();
    const styles = createStyles(isDark, isMobile);
    const [gameStats, setGameStats] = useState<Record<string, { lastPlayed: string, lastTimeTaken: number, highScore: number, proficiency?: string, delta?: number }>>({});

    useFocusEffect(
        useCallback(() => {
            const fetchStats = async () => {
                const stats = await getUserGameStats();
                setGameStats(stats);
            };
            fetchStats();
        }, [])
    );

    const allGames: GameItem[] = [
        {
            id: 101,
            title: 'Time Travel Debug',
            description: 'Order historical events',
            icon: 'history',
            color: '#3F51B5',
            gradient: ['#1a237e', '#3949AB'],
            route: 'TimeTravelDebug',
            category: 'Logic',
            isNew: true,
            gameId: 'time_travel_debug'
        },
        {
            id: 102,
            title: 'Genetics Lab',
            description: 'Predict offspring traits',
            icon: 'dna',
            color: '#4CAF50',
            gradient: ['#43A047', '#66BB6A'],
            route: 'GeneticsLab',
            category: 'Science',
            isNew: true,
            gameId: 'genetics_lab'
        },
        // ... (other games need 'gameId' added to match what they save)

        {
            id: 9,
            title: 'Cell Command',
            description: 'Build a cell part by part',
            icon: 'dna',
            color: '#9C27B0',
            gradient: ['#4A00E0', '#8E2DE2'],
            route: 'CellCommand',
            category: 'Science',
            isNew: true,
            gameId: 'cell_command'
        },
        {
            id: 6,
            title: 'Cell Structure Quiz',
            description: 'Learn about cell parts',
            icon: 'microscope',
            color: '#2196F3',
            gradient: ['#2193b0', '#6dd5ed'],
            route: 'CellStructureQuiz',
            category: 'Science',
            gameId: 'cell_structure_quiz'
        },
        {
            id: 3,
            title: 'Label the Organ',
            description: 'Learn human anatomy',
            icon: 'human-male-height',
            color: '#4CAF50',
            gradient: ['#56ab2f', '#a8e063'],
            route: 'LabelOrganGame',
            category: 'Science',
            gameId: 'label_organ'
        },
        {
            id: 7,
            title: 'Force Simulator',
            description: 'Physics force simulation',
            icon: 'axis-arrow',
            color: '#673AB7',
            gradient: ['#4e4376', '#2b5876'],
            route: 'ForcePlayGame',
            category: 'Science',
            gameId: 'force_play'
        },
        {
            id: 12,
            title: 'Digestive Dash',
            description: 'Match enzymes to nutrients',
            icon: 'stomach',
            color: '#E91E63',
            gradient: ['#ec008c', '#fc6767'],
            route: 'DigestiveDash',
            category: 'Science',
            gameId: 'digestive_dash'
        },
        {
            id: 5,
            title: 'Balance Equations',
            description: 'Chemistry equation balancing',
            icon: 'flask-outline',
            color: '#00BCD4',
            gradient: ['#3a7bd5', '#00d2ff'],
            route: 'ChemistryBalanceGame',
            category: 'Science',
            gameId: 'chemistry_balance'
        },
        {
            id: 4,
            title: 'Quick Math Challenge',
            description: 'Solve math problems fast',
            icon: 'calculator-variant',
            color: '#FF9800',
            gradient: ['#f12711', '#f5af19'],
            route: 'QuickMathGame',
            category: 'Math',
            gameId: 'quick_math'
        },
        {
            id: 1,
            title: 'Odd One Out',
            description: 'Find the different tile',
            icon: 'shape-plus',
            color: '#E91E63',
            gradient: ['#FF416C', '#FF4B2B'],
            route: 'OddOneOut',
            category: 'Logic',
            gameId: 'odd_one_out'
        },
        {
            id: 2,
            title: 'Memory Match',
            description: 'Match pairs of cards',
            icon: 'cards-playing-outline',
            color: '#9C27B0',
            gradient: ['#cc2b5e', '#753a88'],
            route: 'MemoryMatch',
            category: 'Logic',
            gameId: 'memory_match'
        },
    ];

    const groupedGames = useMemo(() => {
        return {
            Science: allGames.filter(g => g.category === 'Science'),
            Math: allGames.filter(g => g.category === 'Math'),
            Logic: allGames.filter(g => g.category === 'Logic'),
        };
    }, []);

    const getSectionTheme = (category: string) => {
        const themes: Record<string, { gradient: [string, string], bgColor: string }> = {
            'Science Lab': { gradient: ['#2196F3', '#42A5F5'], bgColor: '#E3F2FD' },
            'Math Zone': { gradient: ['#FF9800', '#FFB74D'], bgColor: '#FFF3E0' },
            'Brain Teasers': { gradient: ['#9C27B0', '#BA68C8'], bgColor: '#F3E5F5' },
        };
        return themes[category] || { gradient: ['#607D8B', '#90A4AE'], bgColor: '#ECEFF1' };
    };

    const renderSection = (title: string, icon: string, games: GameItem[], delayOffset: number) => {
        const theme = getSectionTheme(title);

        return (
            <Animated.View entering={FadeInUp.delay(delayOffset).duration(600)} style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                    <LinearGradient
                        colors={theme.gradient}
                        style={styles.sectionIcon}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <MaterialCommunityIcons name={icon as any} size={22} color="#fff" />
                    </LinearGradient>
                    <Text style={styles.sectionTitle}>{title}</Text>
                    <Text style={styles.sectionCount}>{games.length} games</Text>
                </View>
                <View style={styles.gamesGrid}>
                    {games.map((game, index) => {
                        const stats = game.gameId ? gameStats[game.gameId] : undefined;

                        return (
                            <Animated.View
                                key={game.id}
                                entering={FadeInRight.delay(delayOffset + index * 100).springify()}
                                style={[styles.gameCardWrapper, { width: isMobile ? '48%' : '48%' }]}
                            >
                                <TouchableOpacity
                                    activeOpacity={0.9}
                                    onPress={() => navigation.navigate(game.route, game.params)}
                                >
                                    <LinearGradient
                                        colors={isDark ? ['#1E293B', '#1E293B'] : ['#EEF2FF', '#EEF2FF']}
                                        style={[
                                            styles.gameCard,
                                            isMobile && {
                                                flexDirection: 'column',
                                                padding: 12,
                                                justifyContent: 'center',
                                                height: 150
                                            }
                                        ]}
                                    >
                                        {/* Gradient Icon Box */}
                                        <LinearGradient
                                            colors={game.gradient}
                                            style={[
                                                styles.iconBox,
                                                isMobile && {
                                                    width: 48,
                                                    height: 48,
                                                    marginRight: 0,
                                                    marginBottom: 10,
                                                    borderRadius: 14
                                                }
                                            ]}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                        >
                                            <MaterialCommunityIcons name={game.icon as any} size={isMobile ? 24 : 36} color="#fff" />
                                        </LinearGradient>

                                        {/* Game Info */}
                                        <View style={[styles.gameInfo, isMobile && { alignItems: 'center', width: '100%' }]}>
                                            <Text
                                                style={[
                                                    styles.gameTitle,
                                                    isMobile && {
                                                        fontSize: 14,
                                                        textAlign: 'center',
                                                        marginBottom: 2
                                                    }
                                                ]}
                                                numberOfLines={1}
                                            >
                                                {game.title}
                                            </Text>
                                            {!isMobile && <Text style={styles.gameDesc} numberOfLines={1}>{game.description}</Text>}

                                            {/* Stats Display - Simplified for Mobile Bento */}
                                            {stats && (
                                                <View style={[styles.statsRow, isMobile && { justifyContent: 'center', marginTop: 4 }]}>
                                                    <View style={styles.statBadge}>
                                                        <MaterialCommunityIcons name="trophy-variant" size={isMobile ? 10 : 12} color={isDark ? '#FCD34D' : '#F59E0B'} />
                                                        <Text style={[styles.statText, isMobile && { fontSize: 10 }]}>{stats.highScore}</Text>
                                                    </View>
                                                </View>
                                            )}
                                        </View>


                                        {/* Badge */}
                                        {(game.isNew || game.isPopular) && !stats && (
                                            <View style={[
                                                styles.badge,
                                                { backgroundColor: game.isNew ? '#6366F1' : '#F59E0B' }
                                            ]}>
                                                <Text style={styles.badgeText}>
                                                    {game.isNew ? 'NEW' : 'HOT'}
                                                </Text>
                                            </View>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                            </Animated.View>

                        );
                    })
                    }
                </View >
            </Animated.View >
        );
    };

    return (
        <ScreenBackground style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            >
                <LinearGradient
                    colors={isDark ? ['#0A1628', '#1E293B'] : ['#6366F1', '#8B5CF6', '#A855F7']}
                    style={styles.headerBackground}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <View style={[styles.headerContent, { paddingTop: insets.top + (isMobile ? 10 : spacing.lg), paddingHorizontal: isMobile ? 16 : 32 }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                            <View style={styles.headerIcon}>
                                <MaterialCommunityIcons name="gamepad-variant" size={30} color="#fff" />
                            </View>
                            <View>
                                <Text style={styles.headerTitle}>Game Zone</Text>
                                <Text style={styles.headerSubtitle}>Play to learn! 🎮</Text>
                            </View>
                        </View>
                    </View>
                </LinearGradient>

                <View style={[styles.contentContainer, { marginTop: 10, paddingBottom: 120 }]}>
                    {renderSection('Science Lab', 'flask', groupedGames.Science, 0)}
                    {renderSection('Math Zone', 'calculator', groupedGames.Math, 200)}
                    {renderSection('Brain Teasers', 'puzzle', groupedGames.Logic, 400)}
                </View>

            </ScrollView>
        </ScreenBackground>
    );
};

const createStyles = (isDark: boolean, isMobile: boolean) => StyleSheet.create({
    container: {
        flex: 1,
        // backgroundColor: isDark ? '#0F172A' : '#F8FAFC', // Handled by ScreenBackground
    },
    scrollView: {
        flex: 1,
    },
    headerBackground: {
        paddingBottom: 80, // Spacious bottom for overlap
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        marginBottom: 0, // No margin, content pulls up
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
        elevation: 10,
    },
    decorativeCircle: {
        position: 'absolute',
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: spacing.md,
        width: '100%',
        maxWidth: 1000,
        alignSelf: 'center',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: -1
    },
    headerSubtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 4
    },
    headerIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)'
    },
    contentContainer: {
        padding: spacing.lg,
        width: '100%',
        maxWidth: 1000,
        alignSelf: 'center',
    },
    sectionContainer: {
        marginBottom: spacing.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    sectionIcon: {
        width: 36,
        height: 36,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.sm,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: isDark ? '#F8FAFC' : '#0F172A',
        flex: 1,
        letterSpacing: -0.5,
    },
    sectionCount: {
        fontSize: 12,
        fontWeight: '600',
        color: isDark ? '#888' : '#888',
        backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    gamesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: spacing.md,
    },
    gameCardWrapper: {
        marginBottom: spacing.sm,
    },
    gameCard: {
        borderRadius: 20,
        padding: spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: isDark ? '#334155' : '#E2E8F0',
        shadowColor: isDark ? '#000' : '#1E293B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDark ? 0.5 : 0.08,
        shadowRadius: 12,
        elevation: 3,
    },
    iconBox: {
        width: 64,
        height: 64,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    gameInfo: {
        flex: 1,
    },
    gameTitle: {
        color: isDark ? '#F8FAFC' : '#0F172A',
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 4,
        letterSpacing: -0.3,
    },
    gameDesc: {
        color: isDark ? '#94A3B8' : '#64748B',
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 6,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 2,
    },
    statBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        backgroundColor: isDark ? '#334155' : '#F1F5F9',
    },
    statText: {
        fontSize: 11,
        fontWeight: '700',
        color: isDark ? '#94A3B8' : '#64748B',
    },
    playButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: spacing.sm
    },
    bgIcon: {
        position: 'absolute',
        right: -20,
        bottom: -20,
        transform: [{ rotate: '-15deg' }],
        zIndex: 1
    },
    badge: {
        position: 'absolute',
        top: 12,
        right: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        zIndex: 3
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 0.5,
    },
    proficiencyBadge: {
        marginTop: 6,
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    proficiencyText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase'
    }
});

export default GamesScreen;
