import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Text, ActivityIndicator, Dimensions, TouchableOpacity } from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BarChart } from 'react-native-chart-kit';
import api from '../../services/api';
import ScreenBackground from '../../components/ScreenBackground';
import CompactHeader from '../../components/ui/CompactHeader';
import { useAppTheme } from '../../context/ThemeContext';
import { useResponsive } from '../../hooks/useResponsive';
import Animated, { FadeInDown } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const TeacherGameAnalyticsScreen = () => {
    const navigation = useNavigation();
    const { isDark, theme } = useAppTheme();
    const { isDesktop, maxContentWidth } = useResponsive();

    const [loading, setLoading] = useState(true);
    const [classStats, setClassStats] = useState<any[]>([]);

    useEffect(() => {
        fetchClassGameStats();
    }, []);

    const fetchClassGameStats = async () => {
        try {
            const response = await api.get('/analytics/class/all');
            // Sort by XP for leaderboard
            const sorted = response.data.sort((a: any, b: any) => (b.xp || 0) - (a.xp || 0));
            setClassStats(sorted);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const getRankColor = (rank: number): [string, string] => {
        switch (rank) {
            case 1: return ['#FFD700', '#FFA000']; // Gold
            case 2: return ['#C0C0C0', '#A0A0A0']; // Silver
            case 3: return ['#CD7F32', '#A0522D']; // Bronze
            default: return ['#6200EA', '#7C4DFF'];
        }
    };

    const styles = createStyles(isDark, isDesktop);

    if (loading) {
        return (
            <ScreenBackground>
                <CompactHeader title="Game Analytics" subtitle="Class Performance" onBack={() => navigation.goBack()} />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#6200EA" />
                </View>
            </ScreenBackground>
        );
    }

    const topThree = classStats.slice(0, 3);
    const chartConfig = {
        backgroundGradientFrom: isDark ? '#1E293B' : '#ffffff',
        backgroundGradientTo: isDark ? '#1E293B' : '#ffffff',
        decimalPlaces: 0,
        color: (opacity = 1) => `rgba(${isDark ? '124, 77, 255' : '98, 0, 234'}, ${opacity})`,
        labelColor: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
        style: { borderRadius: 16 },
        barPercentage: 0.7,
    };

    return (
        <ScreenBackground>
            <CompactHeader
                title="Game Analytics"
                subtitle="Class Performance Overview"
                onBack={() => navigation.goBack()}
            />

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={[styles.contentContainer, isDesktop && { maxWidth: maxContentWidth, alignSelf: 'center', width: '100%' }]}>

                    {/* Overview Card */}


                    {/* Stats Grid */}
                    {classStats.length > 0 && (
                        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.statsGrid}>
                            <View style={styles.statCard}>
                                <MaterialCommunityIcons name="account-group" size={28} color="#6200EA" />
                                <Text style={styles.statValue}>{classStats.length}</Text>
                                <Text style={styles.statLabel}>Total Students</Text>
                            </View>

                            <View style={styles.statCard}>
                                <MaterialCommunityIcons name="chart-line" size={28} color="#4CAF50" />
                                <Text style={styles.statValue}>
                                    {Math.round(classStats.reduce((sum, s) => sum + (s.xp || 0), 0) / classStats.length)}
                                </Text>
                                <Text style={styles.statLabel}>Avg XP</Text>
                            </View>

                            <View style={styles.statCard}>
                                <MaterialCommunityIcons name="fire" size={28} color="#FF6B6B" />
                                <Text style={styles.statValue}>
                                    {Math.round(classStats.reduce((sum, s) => sum + (s.completedTasks || 0), 0) / classStats.length)}
                                </Text>
                                <Text style={styles.statLabel}>Avg Tasks</Text>
                            </View>
                        </Animated.View>
                    )}

                    {/* Learner Distribution Chart */}
                    {classStats.length > 0 && (
                        <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.chartSection}>
                            <Text style={styles.sectionTitle}>📊 Learner Distribution</Text>
                            <View style={styles.chartCard}>
                                <BarChart
                                    data={{
                                        labels: ['Fast', 'Neutral', 'Slow'],
                                        datasets: [{
                                            data: [
                                                classStats.filter(s => s.learnerCategory === 'fast').length,
                                                classStats.filter(s => s.learnerCategory === 'neutral').length,
                                                classStats.filter(s => s.learnerCategory === 'slow').length
                                            ]
                                        }]
                                    }}
                                    width={isDesktop ? Math.min(width - 48, maxContentWidth - 48) : width - 48}
                                    height={220}
                                    yAxisLabel=""
                                    yAxisSuffix=""
                                    chartConfig={chartConfig}
                                    style={styles.chart}
                                    fromZero
                                    showValuesOnTopOfBars
                                />
                                <View style={styles.chartLegend}>
                                    <View style={styles.legendItem}>
                                        <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
                                        <Text style={styles.legendText}>Fast: {classStats.filter(s => s.learnerCategory === 'fast').length}</Text>
                                    </View>
                                    <View style={styles.legendItem}>
                                        <View style={[styles.legendDot, { backgroundColor: '#9E9E9E' }]} />
                                        <Text style={styles.legendText}>Neutral: {classStats.filter(s => s.learnerCategory === 'neutral').length}</Text>
                                    </View>
                                    <View style={styles.legendItem}>
                                        <View style={[styles.legendDot, { backgroundColor: '#FF6B6B' }]} />
                                        <Text style={styles.legendText}>Slow: {classStats.filter(s => s.learnerCategory === 'slow').length}</Text>
                                    </View>
                                </View>
                            </View>
                        </Animated.View>
                    )}

                    {/* Top 3 Podium */}
                    {topThree.length > 0 && (
                        <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.podiumSection}>
                            <Text style={styles.sectionTitle}>🏆 Top Performers</Text>
                            <View style={styles.podium}>
                                {/* 2nd Place */}
                                {topThree[1] && (
                                    <View style={styles.podiumItem}>
                                        <LinearGradient
                                            colors={getRankColor(2)}
                                            style={[styles.podiumCard, styles.secondPlace]}
                                        >
                                            <MaterialCommunityIcons name="medal" size={32} color="#fff" />
                                            <Text style={styles.podiumName} numberOfLines={1}>{topThree[1].name}</Text>
                                            <Text style={styles.podiumXP}>{topThree[1].xp || 0} XP</Text>
                                        </LinearGradient>
                                        <View style={[styles.podiumBase, { height: 70, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#E0E0E0' }]} />
                                    </View>
                                )}

                                {/* 1st Place */}
                                {topThree[0] && (
                                    <View style={styles.podiumItem}>
                                        <LinearGradient
                                            colors={getRankColor(1)}
                                            style={[styles.podiumCard, styles.firstPlace]}
                                        >
                                            <MaterialCommunityIcons name="crown" size={40} color="#fff" />
                                            <Text style={styles.podiumName} numberOfLines={1}>{topThree[0].name}</Text>
                                            <Text style={styles.podiumXP}>{topThree[0].xp || 0} XP</Text>
                                        </LinearGradient>
                                        <View style={[styles.podiumBase, { height: 100, backgroundColor: isDark ? 'rgba(255, 215, 0, 0.2)' : '#FFD700', opacity: isDark ? 1 : 0.3 }]} />
                                    </View>
                                )}

                                {/* 3rd Place */}
                                {topThree[2] && (
                                    <View style={styles.podiumItem}>
                                        <LinearGradient
                                            colors={getRankColor(3)}
                                            style={[styles.podiumCard, styles.thirdPlace]}
                                        >
                                            <MaterialCommunityIcons name="medal-outline" size={28} color="#fff" />
                                            <Text style={styles.podiumName} numberOfLines={1}>{topThree[2].name}</Text>
                                            <Text style={styles.podiumXP}>{topThree[2].xp || 0} XP</Text>
                                        </LinearGradient>
                                        <View style={[styles.podiumBase, { height: 50, backgroundColor: isDark ? 'rgba(205, 127, 50, 0.2)' : '#CD7F32', opacity: isDark ? 1 : 0.3 }]} />
                                    </View>
                                )}
                            </View>
                        </Animated.View>
                    )}

                    {/* Full Leaderboard */}
                    {classStats.length > 0 && (
                        <Animated.View entering={FadeInDown.delay(500).duration(500)} style={styles.leaderboardSection}>
                            <Text style={styles.sectionTitle}>📊 Full Leaderboard</Text>

                            {classStats.map((student: any, index: number) => (
                                <TouchableOpacity
                                    key={student.id}
                                    style={[
                                        styles.studentCard,
                                        index < 3 && styles.topThreeCard
                                    ]}
                                    onPress={() => (navigation as any).navigate('StudentAnalytics', {
                                        studentId: student.id,
                                        studentName: student.name
                                    })}
                                >
                                    <View style={styles.studentInfo}>
                                        <LinearGradient
                                            colors={index < 3 ? getRankColor(index + 1) : isDark ? ['#334155', '#1E293B'] : ['#E0E0E0', '#BDBDBD']}
                                            style={styles.rankBadge}
                                        >
                                            <Text style={styles.rankText}>{index + 1}</Text>
                                        </LinearGradient>

                                        <View style={styles.studentDetails}>
                                            <Text style={styles.studentName}>{student.name}</Text>
                                            <View style={styles.studentStats}>
                                                <View style={styles.statItem}>
                                                    <MaterialCommunityIcons name="trophy" size={14} color="#FFD700" />
                                                    <Text style={styles.studentStatText}>{student.xp || 0} XP</Text>
                                                </View>
                                                <View style={styles.statItem}>
                                                    <MaterialCommunityIcons name="check-circle" size={14} color="#4CAF50" />
                                                    <Text style={styles.studentStatText}>{student.completedTasks || 0} Tasks</Text>
                                                </View>

                                                {/* Learner Category Badge */}
                                                {student.learnerCategory && student.learnerCategory !== 'neutral' && (
                                                    <View style={[
                                                        styles.learnerBadge,
                                                        { backgroundColor: student.learnerCategory === 'fast' ? (isDark ? 'rgba(46, 125, 50, 0.2)' : '#E8F5E9') : (isDark ? 'rgba(239, 108, 0, 0.2)' : '#FFF3E0') }
                                                    ]}>
                                                        <MaterialCommunityIcons
                                                            name={student.learnerCategory === 'fast' ? 'lightning-bolt' : 'clock-alert-outline'}
                                                            size={12}
                                                            color={student.learnerCategory === 'fast' ? '#2E7D32' : '#EF6C00'}
                                                        />
                                                        <Text style={[
                                                            styles.learnerBadgeText,
                                                            { color: student.learnerCategory === 'fast' ? (isDark ? '#4ADE80' : '#2E7D32') : (isDark ? '#FDBA74' : '#EF6C00') }
                                                        ]}>
                                                            {student.learnerCategory === 'fast' ? 'Fast Learner' : 'Slow Learner'}
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>
                                        </View>
                                    </View>

                                    <MaterialCommunityIcons
                                        name="chevron-right"
                                        size={24}
                                        color={isDark ? '#64748B' : '#999'}
                                    />
                                </TouchableOpacity>
                            ))}
                        </Animated.View>
                    )}

                    {classStats.length === 0 && (
                        <View style={styles.emptyState}>
                            <MaterialCommunityIcons name="account-group-outline" size={64} color={isDark ? '#475569' : '#ccc'} />
                            <Text style={styles.emptyText}>No students found</Text>
                            <Text style={styles.emptySubtext}>Students will appear here once they join your class</Text>
                        </View>
                    )}

                    <View style={{ height: 40 }} />
                </View>
            </ScrollView>
        </ScreenBackground>
    );
};

const createStyles = (isDark: boolean, isDesktop: boolean) => StyleSheet.create({
    loadingContainer: {
        flex: 1,
        height: 400,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingVertical: 10,
    },
    contentContainer: {
        width: '100%',
    },
    overviewCard: {
        marginHorizontal: 16,
        marginTop: 10,
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: isDark ? '#000' : '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    overviewGradient: {
        padding: 24,
        alignItems: 'center',
    },
    overviewTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 12,
        marginBottom: 8,
    },
    overviewText: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
        lineHeight: 20,
    },
    statsGrid: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingTop: 20,
        gap: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: isDark ? '#1E293B' : '#fff',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: isDark ? '#fff' : '#333',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        color: isDark ? '#94A3B8' : '#666',
        marginTop: 4,
    },
    podiumSection: {
        marginTop: 24,
        paddingHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: isDark ? '#fff' : '#333',
        marginBottom: 16,
    },
    podium: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-end',
        gap: 8,
        marginBottom: 20,
    },
    podiumItem: {
        alignItems: 'center',
        flex: 1,
    },
    podiumCard: {
        width: '100%',
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 4,
        elevation: 4,
    },
    firstPlace: {
        paddingVertical: 16,
    },
    secondPlace: {
        paddingVertical: 14,
    },
    thirdPlace: {
        paddingVertical: 12,
    },
    podiumName: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 8,
        textAlign: 'center',
    },
    podiumXP: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 4,
    },
    podiumBase: {
        width: '100%',
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
    },
    leaderboardSection: {
        marginTop: 16,
        paddingHorizontal: 16,
    },
    studentCard: {
        backgroundColor: isDark ? '#1E293B' : '#fff',
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
        elevation: 1,
    },
    topThreeCard: {
        borderWidth: 2,
        borderColor: '#FFD700',
        elevation: 3,
    },
    studentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    rankBadge: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    rankText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    studentDetails: {
        flex: 1,
    },
    studentName: {
        fontSize: 16,
        fontWeight: '600',
        color: isDark ? '#fff' : '#333',
        marginBottom: 4,
    },
    studentStats: {
        flexDirection: 'row',
        gap: 12,
        flexWrap: 'wrap',
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    studentStatText: {
        fontSize: 12,
        color: isDark ? '#94A3B8' : '#666',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: isDark ? '#94A3B8' : '#999',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: isDark ? '#64748B' : '#bbb',
        marginTop: 8,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
    learnerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        gap: 4,
    },
    learnerBadgeText: {
        fontSize: 10,
        fontWeight: '700',
    },
    chartSection: {
        marginTop: 24,
        paddingHorizontal: 16,
    },
    chartCard: {
        backgroundColor: isDark ? '#1E293B' : '#fff',
        borderRadius: 16,
        paddingTop: 16,
        paddingBottom: 20,
        paddingHorizontal: 16,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    chart: {
        marginVertical: 8,
        borderRadius: 16,
    },
    chartLegend: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: isDark ? '#334155' : '#f0f0f0',
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 6,
    },
    legendText: {
        fontSize: 12,
        color: isDark ? '#94A3B8' : '#666',
        fontWeight: '600',
    },
});

export default TeacherGameAnalyticsScreen;
