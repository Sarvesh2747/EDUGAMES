import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, Text, TouchableOpacity, Image, ActivityIndicator, useWindowDimensions, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import CustomCard from '../components/ui/CustomCard';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';
import api from '../services/api';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AVATAR_OPTIONS = [
    { id: 1, source: require('../assets/avatars/avatar_student_1_1763752373295.png'), gradient: ['#FF6B6B', '#FF8E53'] as const },
    { id: 2, source: require('../assets/avatars/avatar_student_2_1763752389652.png'), gradient: ['#4FACFE', '#00F2FE'] as const },
    { id: 3, source: require('../assets/avatars/avatar_student_3_1763752405157.png'), gradient: ['#A8EDEA', '#FED6E3'] as const },
    { id: 4, source: require('../assets/avatars/avatar_student_4_1763752424974.png'), gradient: ['#5EE7DF', '#B490CA'] as const },
    { id: 5, source: require('../assets/avatars/avatar_student_5_1763752442026.png'), gradient: ['#F093FB', '#F5576C'] as const },
    { id: 6, source: require('../assets/avatars/avatar_student_6_1763752457724.png'), gradient: ['#FAD961', '#F76B1C'] as const },
    { id: 7, source: require('../assets/avatars/avatar_student_7_1763752477440.png'), gradient: ['#667EEA', '#764BA2'] as const },
];

interface LeaderboardUser {
    _id: string;
    name: string;
    avatar?: string;
    level: number;
    selectedClass: string;
    xp: number;
    streak?: number;
    achievements?: any[];
    weeklyXP?: number;
}
const LeaderboardScreen = () => {
    const navigation = useNavigation();
    const { user } = useAuth();
    const { isDark } = useAppTheme();
    const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeFilter, setTimeFilter] = useState('all'); // 'all', 'week', 'month'
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();

    const styles = createStyles(isDark, insets);

    // Helper function to get avatar source from avatar ID
    const getAvatarSource = (avatarId?: string) => {
        if (!avatarId) return null;
        const avatarNum = parseInt(avatarId);
        const avatar = AVATAR_OPTIONS.find(a => a.id === avatarNum);
        return avatar ? avatar.source : null;
    };

    useEffect(() => {
        fetchLeaderboard();
    }, [timeFilter]);

    const fetchLeaderboard = async () => {
        try {
            const response = await api.get(`/xp/leaderboard?period=${timeFilter}`);
            setLeaderboard(response.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Starry background component (From HomeScreen)
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

    const renderTopThree = () => {
        if (leaderboard.length < 3) return null;

        const [first, second, third] = leaderboard.slice(0, 3);

        return (
            <View style={styles.podiumContainer}>
                {/* Second Place */}
                <View style={styles.podiumItem}>
                    <LinearGradient
                        colors={isDark ? ['rgba(229, 231, 235, 0.2)', 'rgba(156, 163, 175, 0.2)'] : ['#E5E7EB', '#9CA3AF']}
                        style={styles.podiumCard}
                    >
                        <View style={styles.rankBadge}>
                            <MaterialCommunityIcons name="medal" size={24} color="#C0C0C0" />
                            <Text style={styles.rankNumber}>2</Text>
                        </View>
                        <View style={styles.avatarWrapper}>
                            {getAvatarSource(second.avatar) ? (
                                <Image source={getAvatarSource(second.avatar)!} style={styles.podiumAvatar} />
                            ) : (
                                <View style={[styles.avatarPlaceholder, { backgroundColor: '#9CA3AF' }]}>
                                    <Text style={styles.avatarText}>{second.name.charAt(0).toUpperCase()}</Text>
                                </View>
                            )}
                        </View>
                        <Text style={styles.podiumName} numberOfLines={1}>{second.name}</Text>
                        <View style={styles.statsRow}>
                            <MaterialCommunityIcons name="star" size={14} color="#F59E0B" />
                            <Text style={styles.podiumXP}>{second.xp} XP</Text>
                        </View>
                        <Text style={styles.podiumLevel}>Level {second.level}</Text>
                        {second.streak && (
                            <View style={styles.streakBadge}>
                                <MaterialCommunityIcons name="fire" size={12} color="#FF6B6B" />
                                <Text style={styles.streakText}>{second.streak} day streak</Text>
                            </View>
                        )}
                    </LinearGradient>
                </View>

                {/* First Place */}
                <View style={[styles.podiumItem, styles.firstPlace]}>
                    <LinearGradient
                        colors={['#FEF3C7', '#F59E0B']}
                        style={[styles.podiumCard, styles.firstPlaceCard]}
                    >
                        <View style={styles.crownContainer}>
                            <MaterialCommunityIcons name="crown" size={32} color="#F59E0B" />
                        </View>
                        <View style={styles.rankBadge}>
                            <MaterialCommunityIcons name="trophy" size={28} color="#F59E0B" />
                            <Text style={[styles.rankNumber, styles.firstRankNumber]}>1</Text>
                        </View>
                        <View style={styles.avatarWrapper}>
                            {getAvatarSource(first.avatar) ? (
                                <Image source={getAvatarSource(first.avatar)!} style={styles.podiumAvatarLarge} />
                            ) : (
                                <View style={[styles.avatarPlaceholder, styles.avatarPlaceholderLarge, { backgroundColor: '#F59E0B' }]}>
                                    <Text style={[styles.avatarText, styles.avatarTextLarge]}>{first.name.charAt(0).toUpperCase()}</Text>
                                </View>
                            )}
                            <View style={styles.glowRing} />
                        </View>
                        <Text style={[styles.podiumName, styles.firstPlaceName]} numberOfLines={1}>{first.name}</Text>
                        <View style={styles.statsRow}>
                            <MaterialCommunityIcons name="star" size={16} color="#F59E0B" />
                            <Text style={[styles.podiumXP, styles.firstPlaceXP]}>{first.xp} XP</Text>
                        </View>
                        <Text style={[styles.podiumLevel, styles.firstPlaceLevel]}>Level {first.level}</Text>
                        {first.streak && (
                            <View style={[styles.streakBadge, styles.firstStreakBadge]}>
                                <MaterialCommunityIcons name="fire" size={14} color="#FF6B6B" />
                                <Text style={[styles.streakText, styles.firstStreakText]}>{first.streak} day streak</Text>
                            </View>
                        )}
                    </LinearGradient>
                </View>

                {/* Third Place */}
                <View style={styles.podiumItem}>
                    <LinearGradient
                        colors={isDark ? ['rgba(254, 215, 170, 0.2)', 'rgba(180, 83, 9, 0.2)'] : ['#FED7AA', '#B45309']}
                        style={styles.podiumCard}
                    >
                        <View style={styles.rankBadge}>
                            <MaterialCommunityIcons name="medal" size={24} color="#CD7F32" />
                            <Text style={styles.rankNumber}>3</Text>
                        </View>
                        <View style={styles.avatarWrapper}>
                            {getAvatarSource(third.avatar) ? (
                                <Image source={getAvatarSource(third.avatar)!} style={styles.podiumAvatar} />
                            ) : (
                                <View style={[styles.avatarPlaceholder, { backgroundColor: '#B45309' }]}>
                                    <Text style={styles.avatarText}>{third.name.charAt(0).toUpperCase()}</Text>
                                </View>
                            )}
                        </View>
                        <Text style={styles.podiumName} numberOfLines={1}>{third.name}</Text>
                        <View style={styles.statsRow}>
                            <MaterialCommunityIcons name="star" size={14} color="#F59E0B" />
                            <Text style={styles.podiumXP}>{third.xp} XP</Text>
                        </View>
                        <Text style={styles.podiumLevel}>Level {third.level}</Text>
                        {third.streak && (
                            <View style={styles.streakBadge}>
                                <MaterialCommunityIcons name="fire" size={12} color="#FF6B6B" />
                                <Text style={styles.streakText}>{third.streak} day streak</Text>
                            </View>
                        )}
                    </LinearGradient>
                </View>
            </View>
        );
    };

    const renderItem = ({ item, index }: { item: LeaderboardUser, index: number }) => {
        // Skip top 3 only if we have enough users for the podium
        if (leaderboard.length >= 3 && index < 3) return null;

        const isCurrentUser = item._id === user?._id;
        const rank = index + 1;

        return (
            <CustomCard style={[styles.card, isCurrentUser && styles.currentUserCard]}>
                <View style={styles.rankContainer}>
                    <Text style={styles.rankText}>{rank}</Text>
                </View>

                <View style={styles.userInfo}>
                    <View style={styles.avatarContainer}>
                        {getAvatarSource(item.avatar) ? (
                            <Image source={getAvatarSource(item.avatar)!} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatarPlaceholder, { backgroundColor: '#6A5AE0' }]}>
                                <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                            </View>
                        )}
                    </View>
                    <View style={styles.userDetails}>
                        <View style={styles.nameRow}>
                            <Text style={[styles.name, isCurrentUser && styles.currentUserName]}>
                                {item.name} {isCurrentUser && '(You)'}
                            </Text>
                            {/* {item.achievements && item.achievements.length > 0 && (
                                <View style={styles.achievementBadge}>
                                    <MaterialCommunityIcons name="trophy-variant" size={12} color="#F59E0B" />
                                    <Text style={styles.achievementCount}>{item.achievements.length}</Text>
                                </View>
                            )} */}
                        </View>
                        <View style={styles.detailsRow}>
                            <View style={styles.detailItem}>
                                <MaterialCommunityIcons name="school" size={12} color={isDark ? '#94A3B8' : '#6B7280'} />
                                <Text style={styles.detailText}>Level {item.level}</Text>
                            </View>
                            <View style={styles.detailItem}>
                                <MaterialCommunityIcons name="book-open-variant" size={12} color={isDark ? '#94A3B8' : '#6B7280'} />
                                <Text style={styles.detailText}>Class {item.selectedClass}</Text>
                            </View>
                            {item.streak && (
                                <View style={styles.detailItem}>
                                    <MaterialCommunityIcons name="fire" size={12} color="#FF6B6B" />
                                    <Text style={styles.detailText}>{item.streak}d</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                <View style={styles.xpContainer}>
                    <Text style={styles.xpValue}>{item.xp.toLocaleString()}</Text>
                    <Text style={styles.xpLabel}>XP</Text>
                    {item.weeklyXP && (
                        <View style={styles.weeklyXPBadge}>
                            <MaterialCommunityIcons name="trending-up" size={10} color="#10B981" />
                            <Text style={styles.weeklyXPText}>+{item.weeklyXP}</Text>
                        </View>
                    )}
                </View>
            </CustomCard>
        );
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={isDark ? ['#0A1628', '#0F172A', '#1E293B'] : ['#F0F9FF', '#E0F2FE', '#BAE6FD']}
                style={[StyleSheet.absoluteFill, { zIndex: -1 }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            {/* Starry Background */}
            {isDark && (
                <View style={styles.starsContainer}>
                    {renderStars()}
                </View>
            )}

            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />

            {/* Premium Header */}
            <LinearGradient
                colors={isDark ? ['#0A1628', '#1E293B'] : ['#6366F1', '#8B5CF6', '#A855F7']}
                style={styles.headerBackground}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <MaterialCommunityIcons name="trophy" size={28} color="#FFD700" />
                        <Text style={styles.headerTitle}>Leaderboard</Text>
                    </View>
                    <LanguageSwitcher />
                </View>

                {/* Time Filter INSIDE Header */}
                <View style={styles.filterContainer}>
                    <TouchableOpacity
                        style={[styles.filterButton, timeFilter === 'all' && styles.filterButtonActive]}
                        onPress={() => setTimeFilter('all')}
                    >
                        <Text style={[styles.filterButtonText, timeFilter === 'all' && styles.filterButtonTextActive]}>All Time</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterButton, timeFilter === 'month' && styles.filterButtonActive]}
                        onPress={() => setTimeFilter('month')}
                    >
                        <Text style={[styles.filterButtonText, timeFilter === 'month' && styles.filterButtonTextActive]}>This Month</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterButton, timeFilter === 'week' && styles.filterButtonActive]}
                        onPress={() => setTimeFilter('week')}
                    >
                        <Text style={[styles.filterButtonText, timeFilter === 'week' && styles.filterButtonTextActive]}>This Week</Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <View style={{ flex: 1, marginTop: -20 }}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#6366F1" />
                        <Text style={styles.loadingText}>Loading rankings...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={leaderboard}
                        renderItem={renderItem}
                        keyExtractor={(item: LeaderboardUser) => item._id}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        ListHeaderComponent={renderTopThree()}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <MaterialCommunityIcons name="trophy-outline" size={64} color={isDark ? '#475569' : '#9CA3AF'} />
                                <Text style={styles.emptyText}>No rankings yet</Text>
                                <Text style={styles.emptySubtext}>Start learning to appear on the leaderboard!</Text>
                            </View>
                        }
                    />
                )}
            </View>
        </View>
    );
};

const createStyles = (isDark: boolean, insets: any) => StyleSheet.create({
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
    headerBackground: {
        paddingTop: insets.top + 10,
        paddingBottom: 40,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        zIndex: 10,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        marginBottom: 20,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#fff',
    },
    filterContainer: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 24,
    },
    filterButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 25,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
    },
    filterButtonActive: {
        backgroundColor: '#fff',
        borderColor: '#fff',
    },
    filterButtonText: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontWeight: '600',
        fontSize: 13,
    },
    filterButtonTextActive: {
        color: '#4F46E5',
        fontWeight: 'bold',
    },
    podiumContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 20,
        marginTop: 20,
        alignItems: 'flex-end',
        gap: 12,
    },
    podiumItem: {
        flex: 1,
    },
    firstPlace: {
        marginBottom: 20,
    },
    podiumCard: {
        padding: 16,
        borderRadius: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2, // Increased opacity for better visibility
        shadowRadius: 8,
        elevation: 6,
        borderWidth: 1, // Add border to define edges better
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)',
    },
    firstPlaceCard: {
        padding: 20,
        shadowOpacity: 0.3,
        elevation: 10,
    },
    crownContainer: {
        position: 'absolute',
        top: -24,
    },
    rankBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    rankNumber: {
        fontSize: 18,
        fontWeight: '800',
        color: isDark ? '#F3F4F6' : '#1F2937', // Darker text on light podiums
        marginLeft: 4,
    },
    firstRankNumber: {
        fontSize: 22,
        color: '#FFFFFF', // First place usually has saturated bg
    },
    avatarWrapper: {
        position: 'relative',
        marginBottom: 10,
    },
    podiumAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: '#fff',
    },
    podiumAvatarLarge: {
        width: 70,
        height: 70,
        borderRadius: 35,
        borderWidth: 3,
        borderColor: '#fff',
    },
    glowRing: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        top: -5,
        left: -5,
    },
    podiumName: {
        fontSize: 13,
        fontWeight: '700',
        color: isDark ? '#F3F4F6' : '#1F2937',
        marginBottom: 2,
        textAlign: 'center',
    },
    firstPlaceName: {
        fontSize: 15,
        color: '#FFFFFF',
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    podiumXP: {
        fontSize: 11,
        fontWeight: '700',
        color: isDark ? '#FCD34D' : '#D97706',
        marginLeft: 4,
    },
    firstPlaceXP: {
        fontSize: 13,
        color: '#FFF',
    },
    podiumLevel: {
        fontSize: 10,
        color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
    },
    firstPlaceLevel: {
        fontSize: 11,
        color: 'rgba(255, 255, 255, 0.9)',
    },
    streakBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
        marginTop: 6,
    },
    firstStreakBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    streakText: {
        fontSize: 9,
        color: isDark ? '#FFF' : '#1F2937',
        fontWeight: '700',
        marginLeft: 4,
    },
    firstStreakText: {
        color: '#FFF',
    },
    listContent: {
        paddingBottom: 40,
        paddingTop: 0,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginHorizontal: 20,
        marginBottom: 12,
        borderRadius: 16,
        backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.8)', // Glassmorphism-ish
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.5)',
    },
    currentUserCard: {
        borderWidth: 2,
        borderColor: '#6366F1',
        backgroundColor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(240, 249, 255, 0.9)',
    },
    rankContainer: {
        width: 35,
        alignItems: 'center',
        marginRight: 10,
    },
    rankText: {
        fontSize: 16,
        fontWeight: '800',
        color: isDark ? '#94A3B8' : '#64748B',
    },
    userInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        marginRight: 12,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
    },
    avatarPlaceholder: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarPlaceholderLarge: {
        width: 70,
        height: 70,
        borderRadius: 35,
    },
    avatarText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
    },
    avatarTextLarge: {
        fontSize: 28,
    },
    userDetails: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 3,
    },
    name: {
        fontSize: 15,
        fontWeight: '700',
        color: isDark ? '#F1F5F9' : '#1E293B',
        marginRight: 6,
    },
    currentUserName: {
        color: '#6366F1',
    },
    achievementBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: isDark ? '#334155' : '#FEF3C7',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    achievementCount: {
        fontSize: 10,
        fontWeight: '600',
        color: isDark ? '#FCD34D' : '#F59E0B',
        marginLeft: 2,
    },
    detailsRow: {
        flexDirection: 'row',
        gap: 10,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailText: {
        fontSize: 11,
        color: isDark ? '#94A3B8' : '#64748B',
        marginLeft: 3,
    },
    xpContainer: {
        alignItems: 'flex-end',
    },
    xpValue: {
        fontSize: 16,
        fontWeight: '800',
        color: '#6366F1',
        marginBottom: 1,
    },
    xpLabel: {
        fontSize: 10,
        color: isDark ? '#94A3B8' : '#64748B',
        fontWeight: '600',
    },
    weeklyXPBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        paddingHorizontal: 5,
        paddingVertical: 2,
        borderRadius: 6,
        marginTop: 3,
    },
    weeklyXPText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#10B981',
        marginLeft: 2,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 15,
    },
    loadingText: {
        color: isDark ? '#CBD5E1' : '#64748B',
        fontSize: 14,
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 60,
        gap: 12,
    },
    emptyText: {
        color: isDark ? '#CBD5E1' : '#64748B',
        fontSize: 18,
        fontWeight: '700',
    },
    emptySubtext: {
        color: isDark ? '#94A3B8' : '#94A3B8',
        fontSize: 14,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
});

export default LeaderboardScreen;
