import React, { useMemo, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Dimensions } from 'react-native';
import { Text, Surface, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useResponsive } from '../hooks/useResponsive';
import { useAppTheme } from '../context/ThemeContext';
import Animated, { FadeInDown, FadeInRight, FadeInUp } from 'react-native-reanimated';
import { spacing } from '../theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getUserGameStats } from '../services/gamesService';
import { formatTime } from '../hooks/useGameTimer';

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

    const renderSection = (title: string, icon: string, games: GameItem[], delayOffset: number) => (
        <Animated.View entering={FadeInUp.delay(delayOffset).duration(600)} style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
                <View style={[styles.sectionIcon, { backgroundColor: '#E3F2FD' }]}>
                    <MaterialCommunityIcons name={icon as any} size={24} color="#1565C0" />
                </View>
                <Text style={styles.sectionTitle}>{title}</Text>
            </View>
            <View style={styles.gamesGrid}>
                {games.map((game, index) => {
                    const stats = game.gameId ? gameStats[game.gameId] : undefined;

                    return (
                        <Animated.View
                            key={game.id}
                            entering={FadeInRight.delay(delayOffset + index * 100).springify()}
                            style={[styles.gameCardWrapper, { width: isMobile ? '100%' : '48%' }]}
                        >
                            <TouchableOpacity
                                activeOpacity={0.9}
                                onPress={() => navigation.navigate(game.route, game.params)}
                            >
                                <Surface style={styles.gameCard} elevation={3}>
                                    <LinearGradient
                                        colors={game.gradient}
                                        style={styles.gameCardGradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                    >
                                        <MaterialCommunityIcons
                                            name={game.icon as any}
                                            size={100}
                                            color="rgba(255,255,255,0.15)"
                                            style={styles.bgIcon}
                                        />

                                        <View style={styles.cardContent}>
                                            <View style={styles.iconContainer}>
                                                <MaterialCommunityIcons name={game.icon as any} size={32} color="#fff" />
                                            </View>
                                            <View style={styles.textContainer}>
                                                <Text style={styles.gameTitle} numberOfLines={1}>{game.title}</Text>
                                                <Text style={styles.gameDesc} numberOfLines={stats ? 1 : 2}>{game.description}</Text>

                                                {/* Stats Display */}
                                                {stats && (
                                                    <View style={styles.statsRow}>
                                                        {stats.lastTimeTaken !== undefined && (
                                                            <View style={styles.statChip}>
                                                                <MaterialCommunityIcons name="clock-outline" size={12} color="#fff" style={{ marginRight: 2 }} />
                                                                <Text style={styles.statText}>{formatTime(stats.lastTimeTaken)}</Text>
                                                            </View>
                                                        )}
                                                        {stats.lastPlayed && (
                                                            <View style={styles.statChip}>
                                                                <MaterialCommunityIcons name="calendar-clock" size={12} color="#fff" style={{ marginRight: 2 }} />
                                                                <Text style={styles.statText}>Played</Text>
                                                            </View>
                                                        )}
                                                    </View>
                                                )}

                                                {/* Proficiency Badge */}
                                                {stats?.proficiency && stats.proficiency !== 'Not Rated' && (
                                                    <View style={[styles.proficiencyBadge, {
                                                        backgroundColor: stats.proficiency === 'Advanced' ? '#4CAF50' :
                                                            stats.proficiency === 'Proficient' ? '#2196F3' :
                                                                stats.proficiency === 'Developing' ? '#FFC107' : '#FF5252'
                                                    }]}>
                                                        <Text style={styles.proficiencyText}>{stats.proficiency}</Text>
                                                    </View>
                                                )}
                                            </View>
                                            <View style={styles.playButton}>
                                                <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
                                            </View>
                                        </View>

                                        {(game.isNew || game.isPopular) && !stats && (
                                            <View style={[
                                                styles.badge,
                                                { backgroundColor: game.isNew ? '#2979FF' : '#FFC107' }
                                            ]}>
                                                <Text style={[
                                                    styles.badgeText,
                                                    { color: game.isNew ? '#fff' : '#3E2723' }
                                                ]}>
                                                    {game.isNew ? 'NEW' : 'HOT'}
                                                </Text>
                                            </View>
                                        )}
                                    </LinearGradient>
                                </Surface>
                            </TouchableOpacity>
                        </Animated.View>
                    );
                })}
            </View>
        </Animated.View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={{ paddingBottom: 100, paddingTop: insets.top }}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <LinearGradient
                    colors={['#3F51B5', '#5C6BC0', '#7986CB']}
                    style={styles.headerBackground}
                >
                    <View style={[styles.decorativeCircle, { top: -50, right: -50, width: 200, height: 200 }]} />
                    <View style={[styles.decorativeCircle, { bottom: -30, left: -40, width: 140, height: 140 }]} />

                    <View style={styles.headerContent}>
                        <View>
                            <Text style={styles.headerTitle}>Game Zone</Text>
                            <Text style={styles.headerSubtitle}>Play to learn! 🎮</Text>
                        </View>
                        <View style={styles.headerIcon}>
                            <MaterialCommunityIcons name="gamepad-variant" size={36} color="#fff" />
                        </View>
                    </View>
                </LinearGradient>

                <View style={styles.contentContainer}>
                    {renderSection('Science Lab', 'flask', groupedGames.Science, 0)}
                    {renderSection('Math Zone', 'calculator', groupedGames.Math, 200)}
                    {renderSection('Brain Teasers', 'puzzle', groupedGames.Logic, 400)}
                </View>

            </ScrollView>
        </View>
    );
};

const createStyles = (isDark: boolean, isMobile: boolean) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: isDark ? '#121212' : '#F5F7FA',
    },
    scrollView: {
        flex: 1,
    },
    headerBackground: {
        paddingVertical: 30,
        paddingHorizontal: spacing.lg,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        marginBottom: spacing.md,
        overflow: 'hidden',
        position: 'relative'
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
        marginTop: spacing.md
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: 0.5
    },
    headerSubtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 4
    },
    headerIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)'
    },
    contentContainer: {
        padding: spacing.lg,
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
        fontSize: 20,
        fontWeight: 'bold',
        color: isDark ? '#fff' : '#333',
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
        overflow: 'hidden',
        height: 120,
    },
    gameCardGradient: {
        flex: 1,
        padding: spacing.md,
        position: 'relative',
        justifyContent: 'center'
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 2,
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md
    },
    textContainer: {
        flex: 1,
    },
    gameTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 2
    },
    gameDesc: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 12,
        fontWeight: '500'
    },
    statsRow: {
        flexDirection: 'row',
        marginTop: 6,
        gap: 8,
    },
    statChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    statText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
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
        top: 10,
        right: 10,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        zIndex: 3
    },
    badgeText: {
        fontSize: 10,
        fontWeight: 'bold'
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
