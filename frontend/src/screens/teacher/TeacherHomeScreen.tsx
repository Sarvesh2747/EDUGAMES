import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import GradientBackground from '../../components/ui/GradientBackground';
import CustomCard from '../../components/ui/CustomCard';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const TeacherHomeScreen = () => {
    const navigation = useNavigation();
    const { logout, user } = useAuth();
    const [stats, setStats] = useState({
        totalStudents: 0,
        pendingApprovals: 0,
        averageAttendance: '0%'
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/teacher/stats');
                setStats({
                    totalStudents: response.data.totalStudents,
                    pendingApprovals: response.data.pendingApprovals,
                    averageAttendance: response.data.averageAttendance
                });
            } catch (error) {
                console.error('Failed to fetch teacher stats:', error);
            }
        };

        fetchStats();
    }, []);

    const menuItems = [
        { title: 'Approvals', icon: 'checkmark-circle', screen: 'TeacherApprovals', color: '#8B5CF6', badge: stats.pendingApprovals },
        { title: 'My Students', icon: 'people', screen: 'StudentList', color: '#4F46E5' },
        { title: 'Student Wellbeing', icon: 'heart', screen: 'TeacherWellbeing', color: '#10B981' },
        { title: 'Assign Chapters', icon: 'book', screen: 'ChapterAssign', color: '#F59E0B' },
        { title: 'Content Manager', icon: 'folder-open', screen: 'TeacherContentManager', color: '#059669' },
        { title: 'Quiz Creator', icon: 'create', screen: 'TeacherQuizCreator', color: '#EC4899' },
        { title: 'Class Analytics', icon: 'stats-chart', screen: 'TeacherAnalytics', color: '#3B82F6' },
        { title: 'Classroom', icon: 'school', screen: 'TeacherClassroom', color: '#6366F1' },
        { title: 'Game Analytics', icon: 'game-controller', screen: 'TeacherGameAnalytics', color: '#F97316' },
        { title: 'Video Manager', icon: 'logo-youtube', screen: 'TeacherVideoManager', color: '#FF0000' },
        { title: 'Student Feedback', icon: 'chatbubbles', screen: 'TeacherFeedback', color: '#0EA5E9' },
        { title: 'Send Notification', icon: 'notifications', screen: 'TeacherSendNotification', color: '#F43F5E' },
    ];

    return (
        <GradientBackground>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Teacher Dashboard</Text>
                        <Text style={styles.subtitle}>Welcome, {user?.name}</Text>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            onPress={() => (navigation as any).navigate('Notifications')}
                            style={styles.iconButton}
                        >
                            <Ionicons name="notifications-outline" size={24} color="#fff" />
                            <View style={styles.notificationBadge} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={logout} style={styles.iconButton}>
                            <Ionicons name="log-out-outline" size={24} color="#EF4444" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Quick Stats Row */}
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{stats.totalStudents}</Text>
                        <Text style={styles.statLabel}>Students</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{stats.pendingApprovals}</Text>
                        <Text style={styles.statLabel}>Pending</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{stats.averageAttendance}</Text>
                        <Text style={styles.statLabel}>Attendance</Text>
                    </View>
                </View>

                <View style={styles.grid}>
                    {menuItems.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.cardWrapper}
                            onPress={() => (navigation as any).navigate(item.screen)}
                        >
                            <CustomCard style={styles.card}>
                                <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                                    <Ionicons name={item.icon as any} size={32} color={item.color} />
                                </View>
                                <Text style={styles.cardTitle}>{item.title}</Text>
                                {item.badge ? (
                                    <View style={styles.cardBadge}>
                                        <Text style={styles.cardBadgeText}>{item.badge}</Text>
                                    </View>
                                ) : null}
                            </CustomCard>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </GradientBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        paddingTop: 60,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerActions: {
        flexDirection: 'row',
        gap: 10,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    },
    subtitle: {
        fontSize: 16,
        color: '#E5E7EB',
        marginTop: 4,
    },
    iconButton: {
        padding: 10,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        position: 'relative',
    },
    notificationBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#EF4444',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 16,
        padding: 15,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    statLabel: {
        fontSize: 12,
        color: '#E5E7EB',
        marginTop: 2,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    cardWrapper: {
        width: '48%',
        marginBottom: 20,
    },
    card: {
        alignItems: 'center',
        padding: 20,
        height: 150,
        justifyContent: 'center',
        position: 'relative',
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        textAlign: 'center',
    },
    cardBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: '#EF4444',
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    cardBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
});

export default TeacherHomeScreen;
