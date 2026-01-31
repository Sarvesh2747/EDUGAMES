import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, FlatList, Modal, StatusBar } from 'react-native';
import { Text, Surface, Button, ActivityIndicator, useTheme, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../context/ThemeContext';
import FeedbackFormModal from '../components/FeedbackFormModal';
import api from '../services/api';
import SuccessModal from '../components/ui/SuccessModal';
import { formatDistanceToNow } from 'date-fns';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const StudentFeedbackScreen = () => {
    const navigation = useNavigation();
    const { isDark } = useAppTheme();
    const theme = useTheme();
    const insets = useSafeAreaInsets();

    // State
    const [myFeedback, setMyFeedback] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [showTeacherSelection, setShowTeacherSelection] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Modal Configuration
    const [modalConfig, setModalConfig] = useState<{
        visible: boolean;
        targetType: 'app' | 'teacher' | 'all_teachers';
        targetId?: string;
        targetName?: string;
    }>({
        visible: false,
        targetType: 'app'
    });

    useEffect(() => {
        fetchMyFeedback();
        fetchTeachers();
    }, []);

    const fetchTeachers = async () => {
        try {
            const response = await api.get('/users/teachers');
            const fetchedTeachers = response.data.teachers || [];

            // If there are teachers, add "All Teachers" option
            if (fetchedTeachers.length > 0) {
                fetchedTeachers.unshift({
                    _id: 'all',
                    name: 'All Teachers',
                    email: 'Broadcast to all available teachers',
                    avatar: null,
                    isAll: true
                });
            }

            setTeachers(fetchedTeachers);
        } catch (error) {
            console.error('Error fetching teachers:', error);
        }
    };

    const fetchMyFeedback = async () => {
        try {
            const response = await api.get('/feedback/user');
            setMyFeedback(response.data.feedback);
        } catch (error) {
            console.error('Error fetching feedback:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGiveFeedbackPress = () => {
        // Always show modal to select target (App, Teacher, All Teachers)
        setShowTeacherSelection(true);
    };

    const selectTarget = (item: any) => {
        setShowTeacherSelection(false);

        if (item.targetType === 'app') {
            setModalConfig({
                visible: true,
                targetType: 'app',
                targetName: 'App Support'
            });
        } else if (item.targetType === 'teacher_generic') {
            setModalConfig({
                visible: true,
                targetType: 'all_teachers', // Default to all teachers for the generic button
                targetId: 'all',
                targetName: 'Teacher Feedback'
            });
        } else if (item.isAll) {
            setModalConfig({
                visible: true,
                targetType: 'all_teachers',
                targetId: undefined,
                targetName: 'All Teachers'
            });
        } else {
            setModalConfig({
                visible: true,
                targetType: 'teacher',
                targetId: item._id,
                targetName: item.name
            });
        }
    };

    const getSelectionList = () => {
        const list: any[] = [
            { _id: 'app_option', name: 'App Support', email: 'Report bugs or suggest features', targetType: 'app', avatar: null },
            // Always show Teacher Feedback option
            { _id: 'teacher_generic', name: 'Teacher Feedback', email: 'Share with your teachers', targetType: 'teacher_generic', avatar: null }
        ];

        if (teachers.length > 0) {
            const specificTeachers = teachers.filter(t => t._id !== 'all');
            return [...list, ...specificTeachers];
        }

        return list;
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'bug': return '#EF4444';
            case 'suggestion': return '#F59E0B';
            case 'praise': return '#EC4899';
            case 'complaint': return '#F97316';
            default: return '#6B7280';
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'bug': return 'bug';
            case 'suggestion': return 'lightbulb-on';
            case 'praise': return 'heart';
            case 'complaint': return 'alert-circle';
            default: return 'dots-horizontal';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'resolved': return '#10B981';
            case 'reviewed': return '#3B82F6';
            default: return '#9CA3AF';
        }
    };

    // Starry background component
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

    const renderFeedbackItem = ({ item }: any) => (
        <Surface style={[styles.card, { backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)' }]} elevation={2}>
            <View style={styles.cardHeader}>
                <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) + '20' }]}>
                    <MaterialCommunityIcons
                        name={getCategoryIcon(item.category) as any}
                        size={16}
                        color={getCategoryColor(item.category)}
                    />
                    <Text style={[styles.categoryText, { color: getCategoryColor(item.category) }]}>
                        {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                    </Text>
                </View>
                <Text style={[styles.date, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                    {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                </Text>
            </View>

            <View style={styles.ratingContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <MaterialCommunityIcons
                        key={star}
                        name={item.rating >= star ? "star" : "star-outline"}
                        size={16}
                        color={item.rating >= star ? "#FFD700" : "#E2E8F0"}
                    />
                ))}
            </View>

            <Text style={[styles.comment, { color: isDark ? '#E2E8F0' : '#334155' }]}>
                {item.comment}
            </Text>

            <View style={styles.statusRow}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                        Status: {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </Text>
                </View>
                {item.targetName && (
                    <Text style={[styles.targetText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                        For: {item.targetName}
                    </Text>
                )}
            </View>

            {item.adminNotes && (
                <View style={[styles.adminResponse, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]}>
                    <Text style={[styles.adminNotesTitle, { color: isDark ? '#F8FAFC' : '#1E293B' }]}>
                        Admin Response:
                    </Text>
                    <Text style={[styles.adminNotes, { color: isDark ? '#CBD5E1' : '#475569' }]}>
                        {item.adminNotes}
                    </Text>
                </View>
            )}
        </Surface>
    );

    const renderSelectionItem = ({ item }: any) => (
        <TouchableOpacity
            style={[styles.teacherItem, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: isDark ? '#334155' : '#E2E8F0' }]}
            onPress={() => selectTarget(item)}
        >
            {item.targetType === 'app' ? (
                <Avatar.Icon size={40} icon="cellphone" style={{ backgroundColor: theme.colors.primary }} />
            ) : item.targetType === 'teacher_generic' ? (
                <Avatar.Icon size={40} icon="school" style={{ backgroundColor: '#F59E0B' }} />
            ) : item.isAll ? (
                <Avatar.Icon size={40} icon="account-group" style={{ backgroundColor: '#F59E0B' }} />
            ) : item.avatar ? (
                <Avatar.Image size={40} source={{ uri: item.avatar }} />
            ) : (
                <Avatar.Text size={40} label={item.name.substring(0, 2)} />
            )}
            <View style={styles.teacherInfo}>
                <Text style={[styles.teacherName, { color: isDark ? '#FFF' : '#0F172A' }]}>{item.name}</Text>
                <Text style={[styles.teacherEmail, { color: isDark ? '#94A3B8' : '#64748B' }]}>{item.email}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={isDark ? '#64748B' : '#94A3B8'} />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Unified App Background */}
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

            <LinearGradient
                colors={isDark ? ['#0A1628', '#1E293B'] : ['#6366F1', '#8B5CF6', '#A855F7']}
                style={[styles.header, { paddingTop: insets.top + 10 }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text variant="headlineMedium" style={styles.headerTitle}>My Feedback</Text>
                </View>
                <Text style={styles.headerSubtitle}>
                    Help us improve your learning experience
                </Text>
            </LinearGradient>

            <View style={styles.content}>
                <Button
                    mode="contained"
                    onPress={handleGiveFeedbackPress}
                    style={styles.giveFeedbackButton}
                    icon="plus"
                    contentStyle={{ paddingVertical: 8 }}
                    buttonColor={isDark ? '#6366F1' : '#4F46E5'}
                >
                    Give New Feedback
                </Button>

                {loading ? (
                    <ActivityIndicator style={{ marginTop: 40 }} color={theme.colors.primary} />
                ) : (
                    <FlatList
                        data={myFeedback}
                        renderItem={renderFeedbackItem}
                        keyExtractor={(item) => item._id}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <MaterialCommunityIcons name="comment-text-outline" size={64} color={isDark ? '#475569' : '#CBD5E1'} />
                                <Text style={styles.emptyText}>No feedback yet</Text>
                                <Text style={styles.emptySubtext}>Share your thoughts with us!</Text>
                            </View>
                        }
                    />
                )}
            </View>

            <FeedbackFormModal
                visible={modalConfig.visible}
                onClose={() => setModalConfig(prev => ({ ...prev, visible: false }))}
                onSuccess={() => {
                    fetchMyFeedback();
                    setShowSuccessModal(true);
                }}
                initialTargetType={modalConfig.targetType}
                initialTargetId={modalConfig.targetId}
                initialTargetName={modalConfig.targetName}
            />

            {/* Target Selection Modal */}
            <Modal
                visible={showTeacherSelection}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowTeacherSelection(false)}
            >
                <View style={styles.modalOverlay}>
                    <Surface style={[styles.modalContent, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
                        <View style={styles.modalHeader}>
                            <Text variant="titleLarge" style={{ fontWeight: 'bold', color: isDark ? '#FFF' : '#0F172A' }}>
                                Who is this feedback for?
                            </Text>
                            <TouchableOpacity onPress={() => setShowTeacherSelection(false)}>
                                <MaterialCommunityIcons name="close" size={24} color={isDark ? '#FFF' : '#0F172A'} />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={getSelectionList()}
                            renderItem={renderSelectionItem}
                            keyExtractor={(item) => item._id}
                            contentContainerStyle={{ paddingVertical: 10 }}
                        />
                    </Surface>
                </View>
            </Modal>
            <SuccessModal
                visible={showSuccessModal}
                title="Feedback Sent!"
                message="Thank you for your feedback."
                onClose={() => {
                    setShowSuccessModal(false);
                }}
                buttonText="Done"
            />
        </View>
    );
};

const styles = StyleSheet.create({
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
    header: {
        paddingBottom: 40,
        paddingHorizontal: 24,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        zIndex: 10,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    backButton: {
        marginRight: 15,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    headerTitle: {
        color: '#FFF',
        fontWeight: '800',
        fontSize: 24,
    },
    headerSubtitle: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
        marginLeft: 55, // Align with title
        opacity: 0.8,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        marginTop: 20, // Push below header
    },
    giveFeedbackButton: {
        marginBottom: 20,
        borderRadius: 16,
        elevation: 4,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    listContent: {
        paddingBottom: 40,
    },
    card: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    categoryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    categoryText: {
        fontSize: 12,
        fontWeight: '600',
    },
    date: {
        fontSize: 12,
    },
    ratingContainer: {
        flexDirection: 'row',
        marginBottom: 12,
        gap: 2,
    },
    comment: {
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 16,
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    targetText: {
        fontSize: 12,
        fontStyle: 'italic',
    },
    adminResponse: {
        marginTop: 16,
        padding: 12,
        borderRadius: 12,
    },
    adminNotesTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    adminNotes: {
        fontSize: 13,
        lineHeight: 18,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#94A3B8',
        marginTop: 16,
    },
    emptySubtext: {
        color: '#CBD5E1',
        marginTop: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '70%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    teacherItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderWidth: 1,
        borderRadius: 12,
        marginBottom: 10,
    },
    teacherInfo: {
        marginLeft: 12,
        flex: 1,
    },
    teacherName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    teacherEmail: {
        fontSize: 12,
    },
});

export default StudentFeedbackScreen;
