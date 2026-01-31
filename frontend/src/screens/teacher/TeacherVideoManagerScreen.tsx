import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
    TextInput,
    Alert,
    Modal,
    ScrollView,
    ActivityIndicator,
    useWindowDimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { Surface, Button, Text, Portal, Dialog, Paragraph } from 'react-native-paper';
import videoService, { Video } from '../../services/videoService';
import { useAuth } from '../../context/AuthContext';
import ScreenBackground from '../../components/ScreenBackground';
import CompactHeader from '../../components/ui/CompactHeader';
import { useAppTheme } from '../../context/ThemeContext';
import { useResponsive } from '../../hooks/useResponsive';
import Animated, { FadeInDown } from 'react-native-reanimated';

const TeacherVideoManagerScreen = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();
    const { isDark } = useAppTheme();
    const { isDesktop, maxContentWidth } = useResponsive();
    const { width } = useWindowDimensions();

    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Form/Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [editingVideo, setEditingVideo] = useState<Video | null>(null);
    const [title, setTitle] = useState('');
    const [url, setUrl] = useState('');
    const [description, setDescription] = useState('');
    const [subject, setSubject] = useState('Mathematics');
    const [classNum, setClassNum] = useState('6');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Constants
    const subjects = ['Mathematics', 'Science', 'English', 'Social Studies', 'Hindi', 'Computer'];
    const classes = ['6', '7', '8', '9', '10'];

    // Delete State
    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [videoToDelete, setVideoToDelete] = useState<string | null>(null);

    useEffect(() => {
        loadVideos();
    }, []);

    const loadVideos = async () => {
        try {
            const response = await videoService.getVideos();
            setVideos(response.data);
        } catch (error) {
            console.error('Failed to load videos', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const openAddModal = () => {
        setEditingVideo(null);
        resetForm();
        setModalVisible(true);
    };

    const openEditModal = (video: Video) => {
        setEditingVideo(video);
        setTitle(video.title);
        setUrl(video.url);
        setDescription(video.description || '');
        setSubject(video.subject);
        setClassNum(video.class.toString());
        setModalVisible(true);
    };

    const resetForm = () => {
        setTitle('');
        setUrl('');
        setDescription('');
        setSubject('Mathematics');
        setClassNum('6');
    };

    const extractVideoId = (inputUrl: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = inputUrl.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const handleSubmit = async () => {
        if (!title || !url || !subject || !classNum) {
            // Use simple Alert for validation as it's less critical, or replace if strictly needed.
            // For now sticking to console or a toast would be better, but we'll leave basic alert for validation 
            // as it's blocking. However, to be consistent let's just allow it or rely on UI feedback.
            alert('Please fill all required fields');
            return;
        }

        const videoId = extractVideoId(url);
        if (!videoId) {
            Alert.alert('Invalid URL', 'Please enter a valid YouTube URL.');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                title,
                url,
                videoId, // Ensure we save the extracted ID if the backend expects it, though service might do it. 
                // Assuming backend needs 'url' primarily and maybe extracts ID itself, 
                // but standard practice is often to send both if needed.
                // Based on existing code, we strictly send what was there. 
                description,
                subject,
                class: parseInt(classNum),
            };

            if (editingVideo) {
                await videoService.updateVideo(editingVideo._id, payload);
                // Removed Success Alert to avoid web issues, just close modal
            } else {
                await videoService.createVideo(payload);
                // Removed Success Alert
            }

            setModalVisible(false);
            loadVideos();
        } catch (error) {
            console.error('Save error', error);
            alert('Failed to save video');
        } finally {
            setIsSubmitting(false);
        }
    };

    const confirmDelete = async () => {
        if (!videoToDelete) return;

        setIsSubmitting(true);
        try {
            await videoService.deleteVideo(videoToDelete);
            setVideos(prev => prev.filter(v => v._id !== videoToDelete));
            setDeleteDialogVisible(false);
            setVideoToDelete(null);
        } catch (error) {
            console.error(error);
            alert('Failed to delete video');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderVideoItem = ({ item, index }: { item: Video; index: number }) => (
        <Animated.View
            entering={FadeInDown.delay(index * 50).springify()}
            style={[
                styles.cardWrapper,
                isDesktop ? { width: '49%' } : { width: '100%' } // Adjusted width slightly to avoid edge cases
            ]}
        >
            <Surface style={[styles.videoCard, { backgroundColor: isDark ? '#1E293B' : '#fff', borderColor: isDark ? '#334155' : '#E2E8F0' }]}>
                {/* Thumbnail Section */}
                <View style={styles.thumbnailContainer}>
                    <Image
                        source={{ uri: item.thumbnail || `https://img.youtube.com/vi/${item.videoId}/mqdefault.jpg` }}
                        style={styles.thumbnail}
                        resizeMode="cover"
                    />
                    <View style={styles.classBadge}>
                        <Text style={styles.classBadgeText}>Class {item.class}</Text>
                    </View>
                </View>

                {/* Content Section */}
                <View style={styles.cardContent}>
                    <View>
                        <View style={styles.tagRow}>
                            <View style={[styles.subjectTag, { backgroundColor: isDark ? 'rgba(79, 70, 229, 0.2)' : '#EEF2FF' }]}>
                                <Text style={[styles.subjectText, { color: '#4F46E5' }]}>{item.subject}</Text>
                            </View>
                        </View>

                        <Text style={[styles.videoTitle, { color: isDark ? '#fff' : '#1F2937' }]} numberOfLines={2}>
                            {item.title}
                        </Text>

                        {item.description ? (
                            <Text style={[styles.videoDesc, { color: isDark ? '#94A3B8' : '#6B7280' }]} numberOfLines={2}>
                                {item.description}
                            </Text>
                        ) : null}
                    </View>

                    <View style={styles.bottomSection}>
                        <View style={styles.divider} />

                        <View style={styles.actionRow}>
                            <TouchableOpacity
                                onPress={() => openEditModal(item)}
                                style={[styles.actionBtn, { backgroundColor: isDark ? '#334155' : '#F3F4F6' }]}
                            >
                                <MaterialCommunityIcons name="pencil" size={18} color={isDark ? '#CBD5E1' : '#4B5563'} />
                                <Text style={[styles.actionText, { color: isDark ? '#CBD5E1' : '#4B5563' }]}>Edit</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => {
                                    setVideoToDelete(item._id);
                                    setDeleteDialogVisible(true);
                                }}
                                style={[styles.actionBtn, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2' }]}
                            >
                                <MaterialCommunityIcons name="delete-outline" size={18} color="#EF4444" />
                                <Text style={[styles.actionText, { color: '#EF4444' }]}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Surface>
        </Animated.View>
    );

    return (
        <ScreenBackground>
            <View style={{ flex: 1 }}>
                <CompactHeader
                    title="Video Library"
                    subtitle="Manage educational content"
                    onBack={() => navigation.goBack()}
                    rightComponent={
                        <TouchableOpacity
                            onPress={openAddModal}
                            style={styles.headerAddBtn}
                        >
                            <MaterialCommunityIcons name="plus" size={24} color="#4F46E5" />
                        </TouchableOpacity>
                    }
                />

                <View style={[styles.container, isDesktop && { maxWidth: maxContentWidth, alignSelf: 'center', width: '100%' }]}>
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#4F46E5" />
                        </View>
                    ) : (
                        <FlatList
                            data={videos}
                            keyExtractor={item => item._id}
                            renderItem={renderVideoItem}
                            numColumns={isDesktop ? 2 : 1}
                            columnWrapperStyle={isDesktop ? { justifyContent: 'space-between' } : undefined}
                            contentContainerStyle={styles.listContent}
                            refreshing={refreshing}
                            onRefresh={() => {
                                setRefreshing(true);
                                loadVideos();
                            }}
                            showsVerticalScrollIndicator={false}
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    <View style={[styles.emptyIconContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9' }]}>
                                        <MaterialCommunityIcons name="filmstrip-off" size={48} color={isDark ? '#475569' : '#94A3B8'} />
                                    </View>
                                    <Text style={[styles.emptyText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                                        No videos found. Tap the + icon to add one!
                                    </Text>
                                    <Button mode="contained" onPress={openAddModal} style={{ marginTop: 20, backgroundColor: '#4F46E5' }}>
                                        Add First Video
                                    </Button>
                                </View>
                            }
                        />
                    )}
                </View>

                {/* Add/Edit Modal */}
                <Modal visible={modalVisible} animationType="slide" presentationStyle="formSheet">
                    <View style={[styles.modalContainer, { backgroundColor: isDark ? '#0F172A' : '#fff' }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: isDark ? '#334155' : '#E2E8F0' }]}>
                            <Text style={[styles.modalTitle, { color: isDark ? '#fff' : '#1F2937' }]}>
                                {editingVideo ? 'Edit Video' : 'Add New Video'}
                            </Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color={isDark ? '#94A3B8' : '#64748B'} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView contentContainerStyle={styles.formContent}>
                            <View style={styles.formGroup}>
                                <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#4B5563' }]}>TITLE</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: isDark ? '#1E293B' : '#F9FAFB', borderColor: isDark ? '#334155' : '#E5E7EB', color: isDark ? '#fff' : '#1F2937' }]}
                                    value={title}
                                    onChangeText={setTitle}
                                    placeholder="e.g. Introduction to Algebra"
                                    placeholderTextColor={isDark ? '#64748B' : '#9CA3AF'}
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#4B5563' }]}>YOUTUBE URL</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: isDark ? '#1E293B' : '#F9FAFB', borderColor: isDark ? '#334155' : '#E5E7EB', color: isDark ? '#fff' : '#1F2937' }]}
                                    value={url}
                                    onChangeText={setUrl}
                                    placeholder="https://youtube.com/watch?v=..."
                                    placeholderTextColor={isDark ? '#64748B' : '#9CA3AF'}
                                    autoCapitalize="none"
                                />
                            </View>

                            <View style={styles.row}>
                                <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                                    <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#4B5563' }]}>CLASS</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
                                        {classes.map(c => (
                                            <TouchableOpacity
                                                key={c}
                                                onPress={() => setClassNum(c)}
                                                style={[
                                                    styles.chip,
                                                    classNum === c && { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
                                                    { borderColor: isDark ? '#334155' : '#E5E7EB', borderWidth: 1 }
                                                ]}
                                            >
                                                <Text style={[styles.chipText, classNum === c && { color: '#fff' }, { color: classNum === c ? '#fff' : (isDark ? '#94A3B8' : '#64748B') }]}>{c}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#4B5563' }]}>SUBJECT</Text>
                                <View style={styles.wrapTags}>
                                    {subjects.map(s => (
                                        <TouchableOpacity
                                            key={s}
                                            onPress={() => setSubject(s)}
                                            style={[
                                                styles.chip,
                                                subject === s && { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
                                                { borderColor: isDark ? '#334155' : '#E5E7EB', borderWidth: 1, marginBottom: 8 }
                                            ]}
                                        >
                                            <Text style={[styles.chipText, subject === s && { color: '#fff' }, { color: subject === s ? '#fff' : (isDark ? '#94A3B8' : '#64748B') }]}>{s}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#4B5563' }]}>DESCRIPTION (OPTIONAL)</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea, { backgroundColor: isDark ? '#1E293B' : '#F9FAFB', borderColor: isDark ? '#334155' : '#E5E7EB', color: isDark ? '#fff' : '#1F2937' }]}
                                    value={description}
                                    onChangeText={setDescription}
                                    placeholder="What is this video about?"
                                    placeholderTextColor={isDark ? '#64748B' : '#9CA3AF'}
                                    multiline
                                    textAlignVertical="top"
                                />
                            </View>

                            <Button
                                mode="contained"
                                onPress={handleSubmit}
                                loading={isSubmitting}
                                disabled={isSubmitting}
                                style={styles.saveBtn}
                                contentStyle={{ height: 50 }}
                            >
                                {editingVideo ? 'Update Video' : 'Add Video'}
                            </Button>
                        </ScrollView>
                    </View>
                </Modal>

                {/* Delete Confirmation Dialog */}
                <Portal>
                    <Dialog
                        visible={deleteDialogVisible}
                        onDismiss={() => setDeleteDialogVisible(false)}
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
                                Delete Video?
                            </Text>
                            <Text style={{
                                fontSize: 14,
                                color: isDark ? '#94A3B8' : '#64748B',
                                textAlign: 'center',
                                paddingHorizontal: 24
                            }}>
                                Are you sure you want to delete this video? This action cannot be undone.
                            </Text>
                        </View>
                        <Dialog.Actions style={{ paddingHorizontal: 24, paddingBottom: 24, justifyContent: 'space-between' }}>
                            <Button
                                mode="outlined"
                                onPress={() => setDeleteDialogVisible(false)}
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
                                loading={isSubmitting}
                            >
                                Delete
                            </Button>
                        </Dialog.Actions>
                    </Dialog>
                </Portal>

            </View>
        </ScreenBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerAddBtn: {
        backgroundColor: '#fff',
        padding: 8,
        borderRadius: 10,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
        paddingBottom: 40,
        gap: 16,
    },
    cardWrapper: {
        marginBottom: 16,
    },
    videoCard: {
        flex: 1,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        elevation: 2,
    },
    thumbnailContainer: {
        height: 160,
        width: '100%',
        backgroundColor: '#000',
    },
    thumbnail: {
        width: '100%',
        height: '100%',
    },
    classBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.75)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    classBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    cardContent: {
        flex: 1,
        padding: 16,
    },
    bottomSection: {
        marginTop: 'auto',
    },
    tagRow: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    subjectTag: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    subjectText: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    videoTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 6,
        lineHeight: 22,
    },
    videoDesc: {
        fontSize: 13,
        lineHeight: 18,
        marginBottom: 16,
    },
    divider: {
        height: 1,
        backgroundColor: 'transparent',
        marginBottom: 12,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 10,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 10,
        gap: 6,
    },
    actionText: {
        fontSize: 13,
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: 40,
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
    },

    // Modal
    modalContainer: {
        flex: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 24,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    closeBtn: {
        padding: 4,
        borderRadius: 20,
    },
    formContent: {
        padding: 24,
        width: '100%',
        maxWidth: 600,
        alignSelf: 'center',
    },
    formGroup: {
        marginBottom: 24,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 8,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
    },
    textArea: {
        height: 120,
        textAlignVertical: 'top',
    },
    row: {
        flexDirection: 'row',
        marginBottom: 24,
    },
    chipScroll: {
        gap: 8,
        paddingVertical: 4,
    },
    wrapTags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
    },
    chipText: {
        fontSize: 14,
        fontWeight: '500',
    },
    saveBtn: {
        marginTop: 16,
        borderRadius: 12,
        paddingVertical: 6,
        backgroundColor: '#4F46E5',
    },

    // Delete Modal
    deleteOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    deleteModal: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        elevation: 8,
    },
    deleteIcon: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#FEF2F2',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    deleteTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    deleteMsg: {
        fontSize: 15,
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 22,
    },
    deleteActions: {
        flexDirection: 'row',
        width: '100%',
        gap: 16,
    },
});

export default TeacherVideoManagerScreen;
