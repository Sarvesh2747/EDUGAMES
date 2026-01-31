import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { Text, useTheme, Surface } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, ZoomIn, useAnimatedStyle, withRepeat, withTiming, useSharedValue, Easing, FadeIn } from 'react-native-reanimated';
import { useSync } from '../context/SyncContext';
import { getQueueItems, clearQueue, QueueItem, subscribeToQueue } from '../offline/syncQueue';
import { spacing } from '../theme';
import { useResponsive } from '../hooks/useResponsive';
import { useAppTheme } from '../context/ThemeContext';
import ScreenBackground from '../components/ScreenBackground';

const SyncScreen = ({ navigation }: any) => {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const { isDark } = useAppTheme();
    const { isSyncing, isOffline, pendingItems, syncNow } = useSync();
    const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const { containerStyle } = useResponsive();

    // Animation for Sync Icon
    const rotation = useSharedValue(0);

    useEffect(() => {
        if (isSyncing) {
            rotation.value = withRepeat(
                withTiming(360, { duration: 1000, easing: Easing.linear }),
                -1
            );
        } else {
            rotation.value = 0;
        }
    }, [isSyncing]);

    const animatedIconStyle = useAnimatedStyle(() => {
        return {
            transform: [{ rotate: `${rotation.value}deg` }],
        };
    });

    const loadQueueItems = async () => {
        const items = await getQueueItems();
        setQueueItems(items);
    };

    useEffect(() => {
        loadQueueItems();
        const unsubscribe = subscribeToQueue((items) => {
            setQueueItems(items);
        });
        return () => {
            unsubscribe();
        };
    }, []);

    useEffect(() => {
        loadQueueItems();
    }, [isSyncing]);

    const handleManualSync = async () => {
        await syncNow();
        await loadQueueItems();
    };

    const handleClearQueue = async () => {
        await clearQueue();
        await loadQueueItems();
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadQueueItems();
        setRefreshing(false);
    };

    const getTypeLabel = (type: QueueItem['type']) => {
        switch (type) {
            case 'SUBMIT_QUIZ_RESULT': return 'Quiz Result';
            case 'SUBMIT_GAME_RESULT': return 'Game Result';
            case 'GENERIC_SYNC': return 'Generic Data';
            case 'SYNC_XP': return 'XP Sync';
            case 'SYNC_CHAPTER_PROGRESS': return 'Chapter Progress';
            default: return type;
        }
    };

    const getTypeIcon = (type: QueueItem['type']) => {
        switch (type) {
            case 'SUBMIT_QUIZ_RESULT': return 'school-outline';
            case 'SUBMIT_GAME_RESULT': return 'gamepad-variant-outline';
            case 'GENERIC_SYNC': return 'sync';
            case 'SYNC_XP': return 'star-four-points-outline';
            case 'SYNC_CHAPTER_PROGRESS': return 'book-check-outline';
            default: return 'file-document-outline';
        }
    };

    const getTypeGradient = (type: QueueItem['type']): readonly [string, string] => {
        switch (type) {
            case 'SUBMIT_QUIZ_RESULT': return ['#6366F1', '#4F46E5'];
            case 'SUBMIT_GAME_RESULT': return ['#F472B6', '#DB2777'];
            case 'GENERIC_SYNC': return ['#3B82F6', '#2563EB'];
            case 'SYNC_XP': return ['#FBBF24', '#F59E0B'];
            case 'SYNC_CHAPTER_PROGRESS': return ['#10B981', '#059669'];
            default: return ['#94A3B8', '#64748B'];
        }
    };





    const retryCount = queueItems.filter((item) => item.retryCount > 0).length;

    const styles = createStyles(isDark, insets);

    return (
        <ScreenBackground style={styles.container}>

            <ScrollView
                contentContainerStyle={[styles.content, containerStyle]}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? '#fff' : theme.colors.primary} />}
                showsVerticalScrollIndicator={false}
            >
                {/* Premium Header */}
                <LinearGradient
                    colors={isOffline
                        ? ['#991B1B', '#DC2626'] // Dark Red for Offline
                        : isDark ? ['#0F172A', '#1E293B'] : ['#10B981', '#059669', '#047857']} // Emerald/Slate for Online
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.headerBackground}
                >
                    <View style={styles.headerContent}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Sync Manager</Text>
                        <View style={{ width: 44 }} />
                    </View>

                    {/* Status Overview */}
                    <View style={styles.statusOverview}>
                        <View style={styles.statusIconWrapper}>
                            <Animated.View style={[isSyncing && animatedIconStyle]}>
                                <MaterialCommunityIcons
                                    name={isSyncing ? 'loading' : (isOffline ? 'cloud-off-outline' : 'cloud-check-outline')}
                                    size={48}
                                    color="#fff"
                                />
                            </Animated.View>
                        </View>
                        <View style={styles.statusTextWrapper}>
                            <Text style={styles.statusMainText}>
                                {isSyncing ? 'Syncing...' : (isOffline ? 'Offline Mode' : 'All Synced')}
                            </Text>
                            <Text style={styles.statusSubText}>
                                {isSyncing
                                    ? 'Uploading your data...'
                                    : (isOffline ? 'Queued items pending' : 'Your data is up to date')}
                            </Text>
                        </View>
                    </View>
                </LinearGradient>

                {/* Main Body (Overlapping) */}
                <View style={styles.mainContainer}>

                    {/* Stats Grid */}
                    <View style={styles.statsGrid}>
                        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.statCol}>
                            <Surface style={styles.statCard} elevation={2}>
                                <LinearGradient
                                    colors={isDark ? ['#1E293B', '#334155'] : ['#fff', '#F8FAFC']}
                                    style={styles.statGradient}
                                >
                                    <View style={[styles.statIconBadge, { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.2)' : '#EEF2FF' }]}>
                                        <MaterialCommunityIcons name="database-clock-outline" size={24} color="#6366F1" />
                                    </View>
                                    <Text style={styles.statValue}>{queueItems.length}</Text>
                                    <Text style={styles.statLabel}>Pending</Text>
                                </LinearGradient>
                            </Surface>
                        </Animated.View>

                        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.statCol}>
                            <Surface style={styles.statCard} elevation={2}>
                                <LinearGradient
                                    colors={isDark ? ['#1E293B', '#334155'] : ['#fff', '#F8FAFC']}
                                    style={styles.statGradient}
                                >
                                    <View style={[styles.statIconBadge, { backgroundColor: retryCount > 0 ? 'rgba(245, 158, 11, 0.2)' : (isDark ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5') }]}>
                                        <MaterialCommunityIcons name={retryCount > 0 ? "alert-circle-outline" : "check-circle-outline"} size={24} color={retryCount > 0 ? "#F59E0B" : "#10B981"} />
                                    </View>
                                    <Text style={[styles.statValue, retryCount > 0 && { color: '#F59E0B' }]}>{retryCount}</Text>
                                    <Text style={styles.statLabel}>Issues</Text>
                                </LinearGradient>
                            </Surface>
                        </Animated.View>
                    </View>

                    {/* Actions */}
                    <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.actionContainer}>
                        <TouchableOpacity
                            onPress={handleManualSync}
                            disabled={isSyncing || isOffline || queueItems.length === 0}
                            activeOpacity={0.9}
                            style={{ flex: 1 }}
                        >
                            <LinearGradient
                                colors={isSyncing || isOffline || queueItems.length === 0
                                    ? ['#94A3B8', '#64748B']
                                    : ['#2563EB', '#1D4ED8']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.primaryButton}
                            >
                                {isSyncing ? (
                                    <Animated.View style={animatedIconStyle}>
                                        <MaterialCommunityIcons name="loading" size={20} color="#fff" />
                                    </Animated.View>
                                ) : (
                                    <MaterialCommunityIcons name="cloud-sync" size={20} color="#fff" />
                                )}
                                <Text style={styles.primaryButtonText}>{isSyncing ? 'Syncing...' : 'Sync Now'}</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        {queueItems.length > 0 && !isSyncing && (
                            <TouchableOpacity
                                onPress={handleClearQueue}
                                style={styles.secondaryButton}
                            >
                                <MaterialCommunityIcons name="trash-can-outline" size={20} color="#EF4444" />
                            </TouchableOpacity>
                        )}
                    </Animated.View>

                    {/* Queue List */}
                    <View style={styles.listSection}>
                        <Text style={styles.sectionTitle}>Sync Queue</Text>
                        {queueItems.length === 0 ? (
                            <View style={styles.emptyState}>
                                <MaterialCommunityIcons name="check-all" size={64} color={isDark ? '#334155' : '#CBD5E1'} />
                                <Text style={styles.emptyText}>Everything is up to date</Text>
                            </View>
                        ) : (
                            <View style={styles.listContainer}>
                                {queueItems.map((item, index) => (
                                    <Animated.View
                                        key={item.id}
                                        entering={FadeInDown.delay(400 + (index * 50)).duration(500)}
                                    >
                                        <Surface style={styles.queueItem} elevation={1}>
                                            <View style={styles.queueIconContainer}>
                                                <LinearGradient
                                                    colors={getTypeGradient(item.type) as any}
                                                    style={styles.queueIconGradient}
                                                >
                                                    <MaterialCommunityIcons name={getTypeIcon(item.type)} size={20} color="#fff" />
                                                </LinearGradient>
                                            </View>
                                            <View style={styles.queueContent}>
                                                <Text style={styles.queueTitle}>{getTypeLabel(item.type)}</Text>
                                                <Text style={styles.queueTime}>
                                                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </Text>
                                            </View>
                                            {item.retryCount > 0 && (
                                                <View style={styles.retryBadge}>
                                                    <Text style={styles.retryText}>{item.retryCount} retries</Text>
                                                </View>
                                            )}
                                        </Surface>
                                    </Animated.View>
                                ))}
                            </View>
                        )}
                    </View>

                </View>
            </ScrollView>
        </ScreenBackground>
    );
};

const createStyles = (isDark: boolean, insets: any) => StyleSheet.create({
    container: {
        flex: 1,
    },


    content: {
        paddingBottom: 100,
    },
    headerBackground: {
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
        marginBottom: spacing.xl,
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
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
    },
    statusOverview: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.lg,
        marginBottom: spacing.md,
    },
    statusIconWrapper: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    statusTextWrapper: {
        flex: 1,
    },
    statusMainText: {
        fontSize: 26,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 4,
    },
    statusSubText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        fontWeight: '500',
    },
    mainContainer: {
        marginTop: -50,
        paddingHorizontal: spacing.lg,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: spacing.md,
        marginBottom: spacing.lg,
    },
    statCol: {
        flex: 1,
    },
    statCard: {
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: isDark ? '#1E293B' : '#fff',
    },
    statGradient: {
        padding: spacing.lg,
        alignItems: 'center',
    },
    statIconBadge: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '800',
        color: isDark ? '#F1F5F9' : '#1E293B',
    },
    statLabel: {
        fontSize: 12,
        color: isDark ? '#94A3B8' : '#64748B',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    actionContainer: {
        flexDirection: 'row',
        gap: spacing.md,
        marginBottom: spacing.xl,
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 16,
        gap: 8,
        elevation: 4,
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    primaryButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    secondaryButton: {
        width: 56,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 16,
        backgroundColor: isDark ? '#1E293B' : '#fff',
        borderWidth: 1,
        borderColor: '#EF4444',
    },
    listSection: {
        marginBottom: spacing.xl,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: isDark ? '#F1F5F9' : '#1E293B',
        marginBottom: spacing.md,
        marginLeft: 4,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xl,
        borderWidth: 2,
        borderColor: isDark ? '#334155' : '#E2E8F0',
        borderStyle: 'dashed',
        borderRadius: 20,
    },
    emptyText: {
        color: isDark ? '#94A3B8' : '#94A3B8',
        marginTop: spacing.md,
        fontWeight: '500',
    },
    listContainer: {
        gap: spacing.md,
    },
    queueItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: 16,
        backgroundColor: isDark ? '#1E293B' : '#fff',
    },
    queueIconContainer: {
        marginRight: spacing.md,
    },
    queueIconGradient: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    queueContent: {
        flex: 1,
    },
    queueTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: isDark ? '#F1F5F9' : '#1E293B',
        marginBottom: 2,
    },
    queueTime: {
        fontSize: 12,
        color: isDark ? '#94A3B8' : '#64748B',
    },
    retryBadge: {
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    retryText: {
        color: '#F59E0B',
        fontSize: 11,
        fontWeight: '700',
    },
});

export default SyncScreen;
