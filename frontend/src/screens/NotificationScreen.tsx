import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Image, Platform } from 'react-native';
import { Text, Surface, IconButton, ActivityIndicator, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import api from '../services/api';
import { spacing, borderRadius, theme } from '../theme';
import { formatDistanceToNow } from 'date-fns';

const NotificationScreen = () => {
    const navigation = useNavigation();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchNotifications = async () => {
        try {
            const response = await api.get('/notifications');
            setNotifications(response.data.notifications);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchNotifications();
    };

    const markAsRead = async (id: string) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(prev =>
                prev.map(n => n._id === id ? { ...n, isRead: true } : n)
            );
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'assignment': return 'book-education-outline';
            case 'approval': return 'check-decagram-outline';
            case 'reminder': return 'clock-time-four-outline';
            case 'system': return 'information-outline';
            default: return 'bell-ring-outline';
        }
    };

    const getColor = (type: string) => {
        switch (type) {
            case 'assignment': return '#4facfe';
            case 'approval': return '#4CAF50';
            case 'reminder': return '#FF9800';
            default: return '#666';
        }
    };

    const renderItem = ({ item, index }: { item: any, index: number }) => (
        <Animated.View entering={FadeInDown.delay(index * 100).duration(400)} layout={Layout.springify()}>
            <TouchableOpacity
                onPress={() => !item.isRead && markAsRead(item._id)}
                activeOpacity={0.9}
                style={styles.cardContainer}
            >
                <Surface style={[styles.card, !item.isRead && styles.unreadCard]} elevation={2}>
                    <LinearGradient
                        colors={item.isRead ? ['#f0f2f5', '#e6e9ef'] : ['#ebf4ff', '#e1effe']}
                        style={styles.cardGradient}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: getColor(item.type) + '15' }]}>
                            <MaterialCommunityIcons
                                name={getIcon(item.type) as any}
                                size={28}
                                color={getColor(item.type)}
                            />
                        </View>
                        <View style={styles.content}>
                            <View style={styles.headerRow}>
                                <Text style={[styles.title, !item.isRead && styles.unreadText]} numberOfLines={1}>
                                    {item.title}
                                </Text>
                                {!item.isRead && <View style={styles.dot} />}
                            </View>
                            <Text style={styles.message} numberOfLines={3}>{item.message}</Text>
                            <View style={styles.footerRow}>
                                <MaterialCommunityIcons name="clock-outline" size={12} color="#94a3b8" />
                                <Text style={styles.time}>
                                    {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                                </Text>
                            </View>
                        </View>
                    </LinearGradient>
                </Surface>
            </TouchableOpacity>
        </Animated.View>
    );

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#FFFFFF', '#F8FAFC']}
                style={styles.background}
            />

            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#1e293b" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notifications</Text>
                <TouchableOpacity
                    onPress={markAllAsRead}
                    disabled={notifications.every(n => n.isRead)}
                    style={[styles.actionButton, notifications.every(n => n.isRead) && styles.disabledButton]}
                >
                    <MaterialCommunityIcons name="check-all" size={24} color={notifications.every(n => n.isRead) ? '#cbd5e1' : '#6366f1'} />
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={notifications}
                    renderItem={renderItem}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        // Empty state
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIconContainer}>
                                <MaterialCommunityIcons name="bell-off-outline" size={48} color="#94a3b8" />
                            </View>
                            <Text style={styles.emptyTitle}>All Caught Up!</Text>
                            <Text style={styles.emptyText}>You have no new notifications at the moment.</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    background: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingTop: Platform.OS === 'ios' ? 60 : 50,
        paddingBottom: spacing.md,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
        textAlign: 'center',
    },
    backButton: {
        padding: 8,
        borderRadius: 12,
        backgroundColor: '#f8fafc',
    },
    actionButton: {
        padding: 8,
        borderRadius: 12,
        backgroundColor: '#f8fafc',
    },
    disabledButton: {
        opacity: 0.5,
    },
    listContent: {
        padding: spacing.md,
        paddingBottom: 100,
    },
    cardContainer: {
        marginBottom: spacing.md,
    },
    card: {
        borderRadius: 20,
        backgroundColor: '#fff',
        overflow: 'hidden',
    },
    cardGradient: {
        flexDirection: 'row',
        padding: spacing.md,
        alignItems: 'center',
    },
    unreadCard: {
        borderWidth: 1,
        borderColor: '#e0e7ff',
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    content: {
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: '#334155',
        flex: 1,
        marginRight: 8,
    },
    unreadText: {
        color: '#1e293b',
        fontWeight: '800',
    },
    message: {
        fontSize: 14,
        color: '#64748b',
        lineHeight: 20,
        marginBottom: 8,
    },
    footerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    time: {
        fontSize: 12,
        color: '#94a3b8',
        fontWeight: '500',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#3b82f6',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
        padding: spacing.xl,
    },
    emptyIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#334155',
        marginBottom: spacing.xs,
    },
    emptyText: {
        textAlign: 'center',
        color: '#94a3b8',
        fontSize: 16,
        lineHeight: 24,
    },
});

export default NotificationScreen;
