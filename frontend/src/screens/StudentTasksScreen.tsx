import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenBackground from '../components/ScreenBackground';
import { useAuth } from '../context/AuthContext';
import { useSync } from '../context/SyncContext';
import { useAppTheme } from '../context/ThemeContext';
import api from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { gradients, spacing, borderRadius, shadows } from '../theme';
import { useTranslation } from '../i18n';
import UnifiedHeader from '../components/UnifiedHeader';

const TASKS_CACHE_KEY = 'student_tasks_cache';

const StudentTasksScreen = () => {
    const navigation = useNavigation();
    const { user } = useAuth();
    const { t } = useTranslation();
    const { isDark } = useAppTheme();
    const { isOffline } = useSync();
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const styles = StyleSheet.create({
        container: {
            flex: 1,
        },
        scrollContent: {
            paddingTop: spacing.lg,
            paddingBottom: 100,
        },
        headerBackground: {
            paddingTop: 60,
            paddingBottom: spacing.xl,
        },
        header: {
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing.md,
        },
        title: {
            fontSize: 28,
            fontWeight: '700',
            color: '#fff',
            letterSpacing: -0.5,
        },
        subtitle: {
            color: 'rgba(255,255,255,0.8)',
            fontSize: 14,
            marginTop: spacing.xs,
        },
        offlineBadge: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(239, 68, 68, 0.9)',
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.xs + 2,
            borderRadius: 12,
            gap: spacing.xs,
            marginTop: spacing.sm,
            alignSelf: 'flex-start',
        },
        offlineText: {
            color: '#fff',
            fontSize: 12,
            fontWeight: '700',
        },
        list: {
            paddingHorizontal: spacing.lg,
        },
        taskCard: {
            marginBottom: spacing.md,
            padding: spacing.lg + 2,
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
            borderRadius: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0.4 : 0.06,
            shadowRadius: 8,
            elevation: 2,
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.5)',
        },
        taskHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: spacing.md,
        },
        taskIcon: {
            width: 52,
            height: 52,
            borderRadius: 14,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: spacing.md,
            backgroundColor: isDark ? '#334155' : '#EEF2FF',
        },
        taskInfo: {
            flex: 1,
        },
        taskTitle: {
            fontSize: 16,
            fontWeight: '700',
            marginBottom: 4,
            color: isDark ? '#F1F5F9' : '#111827',
            letterSpacing: -0.2,
        },
        taskDate: {
            fontSize: 12,
            color: isDark ? '#94A3B8' : '#6B7280',
        },
        statusBadge: {
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 8,
        },
        statusText: {
            fontSize: 10,
            fontWeight: '700',
            letterSpacing: 0.5,
        },
        actionButton: {
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            padding: spacing.md + 2,
            borderRadius: 12,
            gap: spacing.sm,
        },
        actionButtonText: {
            color: '#fff',
            fontWeight: '700',
            fontSize: 14,
        },
        emptyState: {
            alignItems: 'center',
            marginTop: 60,
            paddingHorizontal: spacing.lg,
        },
        emptyIconContainer: {
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: isDark ? '#1E293B' : '#EEF2FF',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: spacing.lg,
            borderWidth: 1,
            borderColor: isDark ? '#334155' : '#F0F0F0',
        },
        emptyText: {
            color: isDark ? '#F1F5F9' : '#111827',
            fontSize: 20,
            fontWeight: '700',
            marginTop: spacing.md,
        },
        emptySubtext: {
            color: isDark ? '#94A3B8' : '#6B7280',
            fontSize: 14,
            marginTop: spacing.xs,
            textAlign: 'center',
        },
        tabContainer: {
            flexDirection: 'row',
            marginHorizontal: spacing.lg,
            marginBottom: spacing.md,
            borderRadius: 16,
            padding: 4,
            elevation: 4,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            alignSelf: 'center', // Center tabs within constrained view
            width: '100%',
        },
        tab: {
            flex: 1,
            flexDirection: 'row',
            paddingVertical: 12,
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 12,
        },
        activeTab: {
            backgroundColor: isDark ? '#6366F1' : '#EEF2FF',
        },
        tabText: {
            fontWeight: '600',
            fontSize: 15,
        },
        activeTabText: {
            color: isDark ? '#fff' : '#4F46E5',
            fontWeight: 'bold',
        },
        badge: {
            backgroundColor: '#EF4444',
            borderRadius: 10,
            paddingHorizontal: 6,
            paddingVertical: 2,
            marginLeft: 6,
        },
        badgeText: {
            color: '#fff',
            fontSize: 10,
            fontWeight: 'bold',
        },
    });

    useFocusEffect(
        React.useCallback(() => {
            loadTasks();
        }, [isOffline])
    );

    const loadTasks = async () => {
        setLoading(true);
        if (isOffline) {
            await loadFromCache();
        } else {
            await fetchTasks();
        }
        setLoading(false);
    };

    const loadFromCache = async () => {
        try {
            const cached = await AsyncStorage.getItem(TASKS_CACHE_KEY);
            if (cached) {
                setTasks(JSON.parse(cached));
            }
        } catch (error) {
            console.error('Failed to load tasks from cache', error);
        }
    };

    const fetchTasks = async () => {
        try {
            const response = await api.get('/student/tasks');
            setTasks(response.data);
            // Cache the tasks
            await AsyncStorage.setItem(TASKS_CACHE_KEY, JSON.stringify(response.data));
        } catch (error) {
            console.error('Failed to fetch tasks', error);
            // Fallback to cache if fetch fails
            await loadFromCache();
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        if (!isOffline) {
            await fetchTasks();
        }
        setRefreshing(false);
    };

    const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return '#10B981';
            case 'pending': return '#F59E0B';
            default: return '#6B7280';
        }
    };

    const renderTaskItem = (task: any, index: number) => {
        // Determine type-specific labels and icons
        let typeIcon = "book";
        let typeLabel = "Chapter";
        let title = task.chapterName;

        if (task.type === 'quiz') {
            typeIcon = "help-circle";
            typeLabel = "Quiz";
            title = task.title;
        } else if (task.type === 'teacherChapter') {
            typeIcon = "school";
            typeLabel = "Lesson";
            title = task.title;
        }

        const iconColorMap: Record<string, string> = {
            'Science': '#10B981',
            'Mathematics': '#F59E0B',
            'English': '#8B5CF6',
            'Computer': '#3B82F6',
        };
        const iconColor = iconColorMap[task.subject] || '#6366F1';

        return (
            <View key={index} style={[styles.taskCard, task.status === 'completed' && { opacity: 0.8 }]}>
                <View style={styles.taskHeader}>
                    <View style={[styles.taskIcon, task.status === 'completed' && { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
                        <Ionicons name={typeIcon as any} size={26} color={task.status === 'completed' ? '#94A3B8' : iconColor} />
                    </View>
                    <View style={styles.taskInfo}>
                        <Text style={[styles.taskTitle, task.status === 'completed' && { textDecorationLine: 'line-through', color: isDark ? '#64748B' : '#9CA3AF' }]}>{typeLabel}: {title}</Text>
                        <Text style={[styles.taskDate]}>Assigned: {new Date(task.assignedAt).toLocaleDateString()}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) + '20' }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(task.status) }]}>
                            {t(`tasks.${task.status}`).toUpperCase()}
                        </Text>
                    </View>
                </View>

                {task.status === 'pending' && (
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => {
                            if (task.type === 'quiz') {
                                (navigation as any).navigate('Learn', {
                                    screen: 'Quiz',
                                    params: {
                                        quizData: {
                                            quizId: task.quizId,
                                            title: task.title,
                                            assignmentId: task.id
                                        }
                                    }
                                });
                            } else if (task.type === 'teacherChapter') {
                                (navigation as any).navigate('Learn', {
                                    screen: 'LessonReader',
                                    params: {
                                        chapterId: task.chapterId,
                                        title: task.title,
                                        content: task.content,
                                        subject: task.subject
                                    }
                                });
                            } else {
                                const subjectCodeMap: Record<string, string> = {
                                    'Science': 'sci',
                                    'Mathematics': 'math',
                                    'Math': 'math',
                                    'English': 'eng',
                                    'Computer': 'comp'
                                };
                                const code = subjectCodeMap[task.subject] || task.subject.toLowerCase().slice(0, 3);
                                const subjectId = `${code}-${task.classNumber}`;
                                const classId = `class-${task.classNumber}`;

                                (navigation as any).navigate('Learn', {
                                    screen: 'ChapterList',
                                    params: {
                                        subjectId: subjectId,
                                        subjectName: task.subject,
                                        classId: classId
                                    }
                                });
                            }
                        }}
                    >
                        <LinearGradient
                            colors={['#6366F1', '#4F46E5']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.actionButton}
                        >
                            <Text style={styles.actionButtonText}>
                                {task.type === 'quiz' ? `${t('tasks.start')} ${t('home.quiz')}` : `${t('tasks.start')} ${t('home.lessons')}`}
                            </Text>
                            <Ionicons name="arrow-forward" size={16} color="#fff" />
                        </LinearGradient>
                    </TouchableOpacity>
                )
                }
            </View>
        );
    };

    return (
        <ScreenBackground style={styles.container}>
            <UnifiedHeader
                title={t('tasks.title')}
                subtitle="Track your assignments"
                icon="checkbox-marked-circle-outline"
            />

            {/* Content with Overlap */}
            <View style={{ flex: 1, marginTop: -40 }}>
                <View style={{ flex: 1, maxWidth: 800, alignSelf: 'center', width: '100%' }}>
                    {/* Tabs */}
                    <View style={[styles.tabContainer, { backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)' }]}>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
                            onPress={() => setActiveTab('pending')}
                        >
                            <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText, { color: isDark ? '#F1F5F9' : '#333' }]}>To Do</Text>
                            {tasks.filter(t => t.status === 'pending').length > 0 && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>{tasks.filter(t => t.status === 'pending').length}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
                            onPress={() => setActiveTab('completed')}
                        >
                            <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText, { color: isDark ? '#F1F5F9' : '#333' }]}>Completed</Text>
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <ActivityIndicator size="large" color={isDark ? '#6366F1' : '#4F46E5'} style={{ marginTop: 40 }} />
                    ) : (
                        <ScrollView
                            contentContainerStyle={[styles.scrollContent, styles.list, { paddingBottom: 120 }]}
                            showsVerticalScrollIndicator={false}
                            refreshControl={
                                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? '#6366F1' : '#4F46E5'} />
                            }
                        >
                            {isOffline && (
                                <View style={styles.offlineBadge}>
                                    <Ionicons name="cloud-offline" size={14} color="#fff" />
                                    <Text style={styles.offlineText}>Offline Mode</Text>
                                </View>
                            )}
                            {tasks.filter(t => t.status === activeTab).length > 0 ? (
                                tasks.filter(t => t.status === activeTab).map((task, index) => renderTaskItem(task, index))
                            ) : (
                                <View style={styles.emptyState}>
                                    <View style={styles.emptyIconContainer}>
                                        <Ionicons
                                            name={activeTab === 'pending' ? "checkmark-circle-outline" : "list-outline"}
                                            size={50}
                                            color={isDark ? '#6366F1' : '#4F46E5'}
                                        />
                                    </View>
                                    <Text style={styles.emptyText}>
                                        {activeTab === 'pending' ? t('tasks.noTasks') : "No completed tasks yet"}
                                    </Text>
                                    <Text style={styles.emptySubtext}>
                                        {activeTab === 'pending' ? "Great job staying on top of your work!" : "Finish some assignments to see them here."}
                                    </Text>
                                </View>
                            )}
                        </ScrollView>
                    )}
                </View>
            </View>
        </ScreenBackground>
    );
};


export default StudentTasksScreen;
