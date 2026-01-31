import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity, RefreshControl, ActivityIndicator, Alert, useWindowDimensions, Modal, Pressable } from 'react-native';
import { Portal, Dialog, Button, Paragraph } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenBackground from '../../components/ScreenBackground';
import CompactHeader from '../../components/ui/CompactHeader';
import { useAppTheme } from '../../context/ThemeContext';
import { useResponsive } from '../../hooks/useResponsive';
import api from '../../services/api';

const TeacherClassroomScreen = () => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { isDark } = useAppTheme();
    const { isMobile, containerStyle } = useResponsive();

    const [content, setContent] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Delete Dialog State
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<any>(null);

    const handleDeletePress = (item: any) => {
        setItemToDelete(item);
        setShowDeleteDialog(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;

        try {
            if (itemToDelete.type === 'quiz') {
                await api.delete(`/teacher/quiz/${itemToDelete._id}`);
            } else {
                await api.delete(`/teacher/chapter/${itemToDelete._id}`);
            }
            // Refresh content
            await fetchContent();
        } catch (error) {
            console.error('Delete error:', error);
            Alert.alert('Error', 'Failed to delete content');
        } finally {
            setShowDeleteDialog(false);
            setItemToDelete(null);
        }
    };

    useEffect(() => {
        fetchContent();
    }, []);

    const fetchContent = async () => {
        setLoading(true);
        try {
            const response = await api.get('/teacher/content');
            setContent(response.data);
        } catch (error) {
            console.error('Failed to fetch content', error);
            Alert.alert('Error', 'Failed to load content');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchContent();
        setRefreshing(false);
    };

    const getTypeGradient = (type: string): [string, string] => {
        return type === 'quiz' ? ['#EC4899', '#F472B6'] : ['#059669', '#34D399'];
    };

    return (
        <ScreenBackground style={styles.container}>
            {/* Compact Header */}
            <CompactHeader
                title="Classroom Preview"
                subtitle="Your created content"
                onBack={() => navigation.goBack()}
                rightComponent={
                    <TouchableOpacity
                        style={{ width: 40, height: 40, backgroundColor: '#fff', borderRadius: 12, justifyContent: 'center', alignItems: 'center' }}
                        onPress={() => setShowCreateModal(true)}
                    >
                        <MaterialCommunityIcons name="plus" size={24} color="#4F46E5" />
                    </TouchableOpacity>
                }
            />

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#6200EA" />
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={[styles.scrollContent, containerStyle]}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6200EA" />
                    }
                    showsVerticalScrollIndicator={false}
                >
                    {content.length > 0 ? (
                        <>
                            <View style={styles.statsRow}>
                                <View style={[styles.statCard, { backgroundColor: isDark ? '#1E293B' : '#fff' }]}>
                                    <MaterialCommunityIcons name="clipboard-text" size={24} color="#EC4899" />
                                    <Text style={[styles.statValue, { color: isDark ? '#fff' : '#333' }]}>{content.filter(c => c.type === 'quiz').length}</Text>
                                    <Text style={[styles.statLabel, { color: isDark ? '#ccc' : '#666' }]}>Quizzes</Text>
                                </View>
                                <View style={[styles.statCard, { backgroundColor: isDark ? '#1E293B' : '#fff' }]}>
                                    <MaterialCommunityIcons name="book-open-page-variant" size={24} color="#059669" />
                                    <Text style={[styles.statValue, { color: isDark ? '#fff' : '#333' }]}>{content.filter(c => c.type === 'chapter').length}</Text>
                                    <Text style={[styles.statLabel, { color: isDark ? '#ccc' : '#666' }]}>Chapters</Text>
                                </View>
                            </View>

                            <View style={styles.contentList}>
                                {content.map((item, index) => (
                                    <View key={index} style={[styles.contentCard, { backgroundColor: isDark ? '#1E293B' : '#fff' }]}>
                                        {/* Type Badge */}
                                        <LinearGradient
                                            colors={getTypeGradient(item.type)}
                                            style={styles.typeStripe}
                                        />

                                        <View style={styles.cardContent}>
                                            <View style={styles.cardHeader}>
                                                <View style={[styles.iconContainer, {
                                                    backgroundColor: item.type === 'quiz' ? 'rgba(236, 72, 153, 0.1)' : 'rgba(5, 150, 105, 0.1)'
                                                }]}>
                                                    <MaterialCommunityIcons
                                                        name={item.type === 'quiz' ? 'clipboard-text' : 'book-open-page-variant'}
                                                        size={24}
                                                        color={item.type === 'quiz' ? '#EC4899' : '#059669'}
                                                    />
                                                </View>
                                                <View style={styles.cardInfo}>
                                                    <Text style={[styles.cardTitle, { color: isDark ? '#fff' : '#333' }]}>{item.title}</Text>
                                                    <Text style={[styles.cardSubtitle, { color: isDark ? '#aaa' : '#666' }]}>
                                                        {item.subject} • Class {item.classNumber}
                                                    </Text>
                                                </View>
                                            </View>

                                            <View style={styles.metadata}>
                                                <View style={styles.metaItem}>
                                                    <MaterialCommunityIcons name="calendar" size={14} color={isDark ? '#aaa' : '#999'} />
                                                    <Text style={[styles.metaText, { color: isDark ? '#aaa' : '#999' }]}>
                                                        {new Date(item.createdAt).toLocaleDateString()}
                                                    </Text>
                                                </View>
                                                <LinearGradient
                                                    colors={getTypeGradient(item.type)}
                                                    style={styles.typeBadge}
                                                >
                                                    <Text style={styles.typeBadgeText}>
                                                        {item.type === 'quiz' ? 'Quiz' : 'Chapter'}
                                                    </Text>
                                                </LinearGradient>
                                            </View>

                                            {/* Actions */}
                                            <View style={styles.actionRow}>
                                                <TouchableOpacity
                                                    style={[styles.actionButton, styles.previewButton]}
                                                    onPress={() => {
                                                        if (item.type === 'quiz') {
                                                            (navigation as any).navigate('Quiz', { quizData: item, previewMode: true });
                                                        } else {
                                                            (navigation as any).navigate('TeacherChapterViewer', { chapter: item });
                                                        }
                                                    }}
                                                >
                                                    <MaterialCommunityIcons name="eye" size={18} color="#fff" />
                                                    <Text style={styles.actionButtonText}>
                                                        {item.type === 'quiz' ? 'Preview' : 'Read'}
                                                    </Text>
                                                </TouchableOpacity>

                                                {item.type === 'quiz' && (
                                                    <TouchableOpacity
                                                        style={[styles.actionButton, styles.editButton]}
                                                        onPress={() => (navigation as any).navigate('TeacherQuizCreator', { quizToEdit: item })}
                                                    >
                                                        <MaterialCommunityIcons name="pencil" size={18} color="#fff" />
                                                    </TouchableOpacity>
                                                )}

                                                <TouchableOpacity
                                                    style={[styles.actionButton, styles.deleteButton]}
                                                    onPress={() => handleDeletePress(item)}
                                                >
                                                    <MaterialCommunityIcons name="delete" size={18} color="#fff" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </>
                    ) : (
                        <View style={styles.emptyState}>
                            <LinearGradient
                                colors={['rgba(98, 0, 234, 0.1)', 'rgba(124, 77, 255, 0.1)']}
                                style={styles.emptyIconContainer}
                            >
                                <MaterialCommunityIcons name="notebook-check-outline" size={64} color="#6200EA" />
                            </LinearGradient>
                            <Text style={[styles.emptyTitle, { color: isDark ? '#fff' : '#333' }]}>No content yet!</Text>
                            <Text style={[styles.emptyText, { color: isDark ? '#ccc' : '#666' }]}>
                                Create engaging quizzes and chapters for your students to learn from.
                            </Text>

                            {/* CTA Buttons */}
                            <View style={styles.ctaButtons}>
                                <TouchableOpacity
                                    style={styles.ctaButton}
                                    onPress={() => (navigation as any).navigate('TeacherQuizCreator')}
                                >
                                    <LinearGradient
                                        colors={['#EC4899', '#F472B6']}
                                        style={styles.ctaGradient}
                                    >
                                        <MaterialCommunityIcons name="clipboard-text" size={20} color="#fff" />
                                        <Text style={styles.ctaText}>Create Quiz</Text>
                                    </LinearGradient>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.ctaButton}
                                    onPress={() => (navigation as any).navigate('TeacherContentManager')}
                                >
                                    <LinearGradient
                                        colors={['#059669', '#34D399']}
                                        style={styles.ctaGradient}
                                    >
                                        <MaterialCommunityIcons name="book-open-page-variant" size={20} color="#fff" />
                                        <Text style={styles.ctaText}>Create Chapter</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </ScrollView>
            )}

            {/* Create Content Modal */}
            <Modal
                visible={showCreateModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowCreateModal(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setShowCreateModal(false)}
                >
                    <Pressable
                        style={[styles.modalContent, { backgroundColor: isDark ? '#1E293B' : '#fff' }]}
                        onPress={e => e.stopPropagation()}
                    >
                        <Text style={[styles.modalTitle, { color: isDark ? '#fff' : '#1E293B' }]}>
                            Create Content
                        </Text>
                        <Text style={[styles.modalSubtitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                            What would you like to create today?
                        </Text>

                        <View style={styles.modalOptions}>
                            <TouchableOpacity
                                style={[styles.modalOption, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]}
                                onPress={() => {
                                    setShowCreateModal(false);
                                    (navigation as any).navigate('TeacherQuizCreator');
                                }}
                            >
                                <View style={[styles.optionIcon, { backgroundColor: '#EC489915' }]}>
                                    <MaterialCommunityIcons name="clipboard-text" size={24} color="#EC4899" />
                                </View>
                                <View style={styles.optionText}>
                                    <Text style={[styles.optionTitle, { color: isDark ? '#fff' : '#1E293B' }]}>New Quiz</Text>
                                    <Text style={[styles.optionDesc, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                                        Create an interactive quiz
                                    </Text>
                                </View>
                                <MaterialCommunityIcons name="chevron-right" size={24} color={isDark ? '#94A3B8' : '#CBD5E1'} />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalOption, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]}
                                onPress={() => {
                                    setShowCreateModal(false);
                                    (navigation as any).navigate('TeacherContentManager');
                                }}
                            >
                                <View style={[styles.optionIcon, { backgroundColor: '#05966915' }]}>
                                    <MaterialCommunityIcons name="book-open-page-variant" size={24} color="#059669" />
                                </View>
                                <View style={styles.optionText}>
                                    <Text style={[styles.optionTitle, { color: isDark ? '#fff' : '#1E293B' }]}>New Chapter</Text>
                                    <Text style={[styles.optionDesc, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                                        Add reading material or notes
                                    </Text>
                                </View>
                                <MaterialCommunityIcons name="chevron-right" size={24} color={isDark ? '#94A3B8' : '#CBD5E1'} />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => setShowCreateModal(false)}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </Pressable>
                </Pressable>
            </Modal>
            {/* Delete Confirmation Dialog */}
            <Portal>
                <Dialog
                    visible={showDeleteDialog}
                    onDismiss={() => setShowDeleteDialog(false)}
                    style={{
                        backgroundColor: isDark ? '#1E293B' : '#fff',
                        borderRadius: 16,
                        maxWidth: 400,
                        width: '90%',
                        alignSelf: 'center'
                    }}
                >
                    <View style={{ alignItems: 'center', marginVertical: 20 }}>
                        <View style={{
                            width: 64,
                            height: 64,
                            borderRadius: 16,
                            backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginBottom: 16
                        }}>
                            <MaterialCommunityIcons name="delete-outline" size={32} color="#EF4444" />
                        </View>
                        <Text style={{
                            fontSize: 20,
                            fontWeight: 'bold',
                            color: isDark ? '#fff' : '#1E293B',
                            marginBottom: 8
                        }}>
                            Delete Content?
                        </Text>
                        <Text style={{
                            fontSize: 14,
                            color: isDark ? '#94A3B8' : '#64748B',
                            textAlign: 'center',
                            paddingHorizontal: 24
                        }}>
                            Are you sure you want to delete "{itemToDelete?.title}"? This action cannot be undone.
                        </Text>
                    </View>
                    <Dialog.Actions style={{ paddingHorizontal: 24, paddingBottom: 24, justifyContent: 'space-between' }}>
                        <Button
                            mode="outlined"
                            onPress={() => setShowDeleteDialog(false)}
                            style={{ flex: 1, marginRight: 8, borderRadius: 8, borderColor: isDark ? '#475569' : '#E2E8F0' }}
                            textColor={isDark ? '#CBD5E1' : '#64748B'}
                        >
                            Cancel
                        </Button>
                        <Button
                            mode="contained"
                            onPress={confirmDelete}
                            style={{ flex: 1, marginLeft: 8, borderRadius: 8, backgroundColor: '#EF4444' }}
                            textColor="#fff"
                        >
                            Delete
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </ScreenBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingBottom: 24,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        elevation: 8,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
    },
    headerContent: {
        flex: 1,
        marginLeft: 16,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 2,
    },
    addButton: {
        backgroundColor: '#fff',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        padding: 20,
        paddingTop: 10,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        elevation: 2,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        marginTop: 4,
    },
    contentList: {
        gap: 16,
    },
    contentCard: {
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    typeStripe: {
        height: 4,
    },
    cardContent: {
        padding: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    cardInfo: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 12,
    },
    metadata: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 12,
    },
    typeBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    typeBadgeText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#fff',
    },
    actionRow: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        borderRadius: 8,
        gap: 4,
    },
    previewButton: {
        backgroundColor: '#4F46E5',
        flex: 1,
    },
    editButton: {
        backgroundColor: '#3B82F6',
        paddingHorizontal: 12,
    },
    deleteButton: {
        backgroundColor: '#EF4444',
        paddingHorizontal: 12,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 20,
    },
    emptyIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    emptyText: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
    },
    ctaButtons: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    ctaButton: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 4,
    },
    ctaGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        gap: 8,
    },
    ctaText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 24,
        padding: 24,
        elevation: 5,
        shadowColor: 'black',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: 14,
        marginBottom: 24,
        textAlign: 'center',
    },
    modalOptions: {
        gap: 12,
        marginBottom: 24,
    },
    modalOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    optionIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    optionText: {
        flex: 1,
    },
    optionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    optionDesc: {
        fontSize: 12,
    },
    cancelButton: {
        paddingVertical: 12,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#64748B',
    },
});

export default TeacherClassroomScreen;
