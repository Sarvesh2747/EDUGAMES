import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity, RefreshControl, ActivityIndicator, Alert, Image, Modal, Pressable, TextInput as RNTextInput } from 'react-native';
import { Portal, Dialog, Button, Paragraph, TextInput } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext'; // Added
import ScreenBackground from '../../components/ScreenBackground';
import { useAppTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import { fetchClassroom, addStudentToClassroom, removeStudentFromClassroom } from '../../services/teacherService';
import { format } from 'date-fns';
import CustomDateTimePicker from '../../components/CustomDateTimePicker';

const TeacherClassroomScreen = () => {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const { isDark } = useAppTheme();
    const { user } = useAuth(); // Added
    const { params } = useRoute<any>();
    const classroom = params?.classroom;

    // State
    const [liveClasses, setLiveClasses] = useState<any[]>([]);

    // Scheduling Form State
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [scheduleForm, setScheduleForm] = useState({
        topic: '',
        date: new Date(),
        startTime: new Date(),
        duration: '60'
    });
    const [scheduling, setScheduling] = useState(false);

    // Date/Time Display helpers
    const [dateText, setDateText] = useState(new Date().toISOString().split('T')[0]);
    const [timeText, setTimeText] = useState('10:00');

    // Picker State
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    // Tabs & Content State (Restored)
    const [activeTab, setActiveTab] = useState<'stream' | 'classwork' | 'people' | 'live'>('stream');
    const [content, setContent] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAddStudentModal, setShowAddStudentModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    // Forms
    const [newStudentEmail, setNewStudentEmail] = useState('');
    const [addingStudent, setAddingStudent] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<any>(null);
    const [announcement, setAnnouncement] = useState('');




    // ... (render methods)

    // Schedule Live Class Modal (redesigned)
    const renderScheduleModal = () => (
        <Modal visible={showScheduleModal} transparent animationType="slide" onRequestClose={() => setShowScheduleModal(false)}>
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}>
                    <Text style={[styles.modalTitle, { color: isDark ? '#FFF' : '#202124' }]}>Schedule Live Class</Text>

                    {/* Topic Input - Premium Style */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.inputLabel, { color: isDark ? '#A0AEC0' : '#5f6368' }]}>Topic</Text>
                        <TextInput
                            mode="outlined"
                            value={scheduleForm.topic}
                            onChangeText={(text) => setScheduleForm({ ...scheduleForm, topic: text })}
                            style={styles.premiumInput}
                            outlineColor={isDark ? '#4A5568' : '#DADCE0'}
                            activeOutlineColor="#1967D2"
                            textColor={isDark ? '#FFF' : '#000'}
                            theme={{ colors: { onSurfaceVariant: isDark ? '#A0AEC0' : '#5f6368' } }}
                        />
                    </View>

                    <View style={styles.row}>
                        {/* Date Picker Trigger */}
                        <TouchableOpacity
                            style={[styles.pickerButton, { borderColor: isDark ? '#4A5568' : '#DADCE0' }]}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <Text style={[styles.inputLabel, { color: isDark ? '#A0AEC0' : '#5f6368' }]}>Date</Text>
                            <View style={styles.pickerContent}>
                                <MaterialCommunityIcons name="calendar-month-outline" size={20} color={isDark ? '#FFF' : '#5f6368'} />
                                <Text style={[styles.pickerText, { color: isDark ? '#FFF' : '#202124' }]}>
                                    {format(scheduleForm.date, 'MMM d, yyyy')}
                                </Text>
                            </View>
                        </TouchableOpacity>

                        {/* Time Picker Trigger */}
                        <TouchableOpacity
                            style={[styles.pickerButton, { borderColor: isDark ? '#4A5568' : '#DADCE0' }]}
                            onPress={() => setShowTimePicker(true)}
                        >
                            <Text style={[styles.inputLabel, { color: isDark ? '#A0AEC0' : '#5f6368' }]}>Time</Text>
                            <View style={styles.pickerContent}>
                                <MaterialCommunityIcons name="clock-outline" size={20} color={isDark ? '#FFF' : '#5f6368'} />
                                <Text style={[styles.pickerText, { color: isDark ? '#FFF' : '#202124' }]}>
                                    {format(scheduleForm.startTime, 'h:mm a')}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Duration Input */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.inputLabel, { color: isDark ? '#A0AEC0' : '#5f6368' }]}>Duration (minutes)</Text>
                        <TextInput
                            mode="outlined"
                            value={scheduleForm.duration}
                            onChangeText={(text) => setScheduleForm({ ...scheduleForm, duration: text })}
                            keyboardType="numeric"
                            style={styles.premiumInput}
                            outlineColor={isDark ? '#4A5568' : '#DADCE0'}
                            activeOutlineColor="#1967D2"
                            textColor={isDark ? '#FFF' : '#000'}
                            theme={{ colors: { onSurfaceVariant: isDark ? '#A0AEC0' : '#5f6368' } }}
                        />
                    </View>

                    <View style={styles.modalButtons}>
                        <Button mode="text" onPress={() => setShowScheduleModal(false)} textColor={isDark ? '#A0AEC0' : '#5f6368'}>
                            Cancel
                        </Button>
                        <Button
                            mode="contained"
                            onPress={handleScheduleClass}
                            loading={scheduling}
                            buttonColor="#D93025"
                            style={styles.scheduleButton}
                        >
                            Schedule
                        </Button>
                    </View>
                </View>
            </View>

            {/* Custom Pickers */}
            <CustomDateTimePicker
                visible={showDatePicker}
                mode="date"
                initialDate={scheduleForm.date}
                onClose={() => setShowDatePicker(false)}
                onSelect={(date) => {
                    setScheduleForm({ ...scheduleForm, date: date });
                    setShowDatePicker(false);
                }}
            />

            <CustomDateTimePicker
                visible={showTimePicker}
                mode="time"
                initialDate={scheduleForm.startTime}
                onClose={() => setShowTimePicker(false)}
                onSelect={(date) => {
                    setScheduleForm({ ...scheduleForm, startTime: date });
                    setShowTimePicker(false);
                }}
            />
        </Modal>
    );





    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        await Promise.all([fetchContent(), loadClassroomDetails(), fetchLiveClasses()]);
        setLoading(false);
    };

    const fetchLiveClasses = async () => {
        if (!classroom?._id) return;
        try {
            const response = await api.get(`/live-classes/classroom/${classroom._id}`);
            setLiveClasses(response.data);
        } catch (error) {
            console.error('Failed to fetch live classes', error);
        }
    };

    const handleScheduleClass = async () => {
        if (!scheduleForm.topic || !scheduleForm.duration) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }

        setScheduling(true);
        try {
            const finalDate = new Date(scheduleForm.date);
            finalDate.setHours(scheduleForm.startTime.getHours());
            finalDate.setMinutes(scheduleForm.startTime.getMinutes());

            if (isNaN(finalDate.getTime())) {
                throw new Error('Invalid Date/Time format');
            }

            const payload = {
                classId: classroom.classId || classroom._id,
                subject: classroom.subjectId || classroom.subject,
                topic: scheduleForm.topic,
                startAt: finalDate,
                duration: parseInt(scheduleForm.duration)
            };

            await api.post('/live-classes/schedule', payload);
            Alert.alert('Success', 'Live Class Scheduled!');
            setShowScheduleModal(false);
            setScheduleForm({
                topic: '',
                date: new Date(),
                startTime: new Date(),
                duration: '60'
            });
            fetchLiveClasses();
        } catch (error: any) {
            Alert.alert('Error', error?.response?.data?.message || 'Failed to schedule class');
        } finally {
            setScheduling(false);
        }
    };

    const loadClassroomDetails = async () => {
        if (classroom?._id) {
            try {
                const data = await fetchClassroom(classroom._id);
                if (data.students) {
                    setStudents(data.students);
                }
            } catch (error) {
                console.error('Failed to load classroom details', error);
            }
        }
    };

    const fetchContent = async () => {
        try {
            const response = await api.get('/teacher/content');
            let data = response.data;
            if (data.quizzes || data.chapters) {
                const formatted = [
                    ...(data.quizzes || []).map((q: any) => ({ ...q, type: 'quiz' })),
                    ...(data.chapters || []).map((c: any) => ({ ...c, type: 'chapter' }))
                ];
                setContent(formatted);
            }
        } catch (error) {
            console.error('Error fetching content:', error);
        }
    };

    const handleAddStudent = async () => {
        if (!newStudentEmail.trim() || !classroom?._id) {
            Alert.alert('Error', 'Please enter a valid email');
            return;
        }

        setAddingStudent(true);
        try {
            await addStudentToClassroom(classroom._id, newStudentEmail.trim());
            Alert.alert('Success', 'Student added successfully');
            setNewStudentEmail('');
            setShowAddStudentModal(false);
            await loadClassroomDetails();
        } catch (error: any) {
            Alert.alert('Error', error?.response?.data?.message || 'Failed to add student');
        } finally {
            setAddingStudent(false);
        }
    };

    const handleRemoveStudent = (studentId: string) => {
        Alert.alert(
            'Remove Student',
            'Are you sure you want to remove this student from the classroom?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            if (classroom?._id) {
                                await removeStudentFromClassroom(classroom._id, studentId);
                                await loadClassroomDetails();
                                Alert.alert('Success', 'Student removed successfully');
                            }
                        } catch (error) {
                            Alert.alert('Error', 'Failed to remove student');
                        }
                    }
                }
            ]
        );
    };

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
            await fetchContent();
        } catch (error) {
            console.error('Delete error:', error);
            Alert.alert('Error', 'Failed to delete content');
        } finally {
            setShowDeleteDialog(false);
            setItemToDelete(null);
        }
    };

    const handleCreateContent = (type: 'quiz' | 'chapter') => {
        setShowCreateModal(false);
        if (type === 'quiz') {
            (navigation as any).navigate('TeacherQuizCreator');
        } else {
            (navigation as any).navigate('TeacherContentManager');
        }
    };

    const renderHeader = () => (
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
                <MaterialCommunityIcons name="arrow-left" size={24} color="#5f6368" />
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>{classroom?.title || 'Social'}</Text>
            <TouchableOpacity style={styles.headerButton}>
                <MaterialCommunityIcons name="dots-vertical" size={24} color="#5f6368" />
            </TouchableOpacity>
        </View>
    );

    const renderBanner = () => (
        <View style={styles.bannerContainer}>
            <LinearGradient
                colors={classroom?.gradient || ['#10B981', '#059669']}
                style={styles.bannerGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <Image
                    source={{ uri: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&h=300&fit=crop' }}
                    style={styles.bannerImage}
                    resizeMode="cover"
                />
                <LinearGradient
                    colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.7)']}
                    style={styles.bannerOverlay}
                >
                    <View style={styles.bannerContent}>
                        <Text style={styles.bannerTitle}>{classroom?.title || 'Social'}</Text>
                        <Text style={styles.bannerSubtitle}>
                            {classroom?.section
                                ? `${classroom.classNumber}${classroom.section}`
                                : `Class ${classroom?.classNumber || ''}`}
                        </Text>
                    </View>
                    <TouchableOpacity style={styles.bannerInfoButton}>
                        <MaterialCommunityIcons name="information-outline" size={28} color="#fff" />
                    </TouchableOpacity>
                </LinearGradient>
            </LinearGradient>
        </View>
    );

    const renderTabs = () => (
        <View style={styles.tabsContainer}>
            <TouchableOpacity
                style={[styles.tab, activeTab === 'stream' && styles.activeTab]}
                onPress={() => setActiveTab('stream')}
            >
                <Text style={[styles.tabText, activeTab === 'stream' && styles.activeTabText]}>STREAM</Text>
                {activeTab === 'stream' && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.tab, activeTab === 'classwork' && styles.activeTab]}
                onPress={() => setActiveTab('classwork')}
            >
                <Text style={[styles.tabText, activeTab === 'classwork' && styles.activeTabText]}>CLASSWORK</Text>
                {activeTab === 'classwork' && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.tab, activeTab === 'people' && styles.activeTab]}
                onPress={() => setActiveTab('people')}
            >
                <Text style={[styles.tabText, activeTab === 'people' && styles.activeTabText]}>PEOPLE</Text>
                {activeTab === 'people' && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.tab, activeTab === 'live' && styles.activeTab]}
                onPress={() => setActiveTab('live')}
            >
                <Text style={[styles.tabText, activeTab === 'live' && styles.activeTabText]}>LIVE</Text>
                {activeTab === 'live' && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
        </View>
    );

    const renderStreamTab = () => (
        <ScrollView style={styles.tabContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} />}>
            {/* Announcement Input */}
            <View style={styles.announcementCard}>
                <View style={styles.announcementInputRow}>
                    <View style={styles.avatarCircle}>
                        <Text style={styles.avatarText}>T</Text>
                    </View>
                    <TouchableOpacity style={styles.announcementInput}>
                        <Text style={styles.announcementPlaceholder}>Share with your class...</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Sample Post */}
            <View style={styles.postCard}>
                <View style={styles.postHeader}>
                    <View style={styles.postIcon}>
                        <MaterialCommunityIcons name="file-document-outline" size={24} color="#1967D2" />
                    </View>
                    <View style={styles.postInfo}>
                        <Text style={styles.postAuthor}>Teacher posted a new assignment: HTML Hard Quiz</Text>
                        <Text style={styles.postDate}>31/1/2026</Text>
                    </View>
                    <MaterialCommunityIcons name="check" size={20} color="#1E8E3E" />
                </View>
            </View>

            <View style={styles.emptyState}>
                <MaterialCommunityIcons name="forum-outline" size={64} color="#DADCE0" />
                <Text style={styles.emptyText}>This is where you'll see posts</Text>
                <Text style={styles.emptySubtext}>from teachers and classmates</Text>
            </View>
        </ScrollView>
    );

    const renderClassworkTab = () => (
        <ScrollView style={styles.tabContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} />}>
            {loading ? (
                <ActivityIndicator size="large" color="#1967D2" style={{ marginTop: 40 }} />
            ) : content.length === 0 ? (
                <View style={styles.emptyState}>
                    <MaterialCommunityIcons name="book-open-page-variant-outline" size={64} color="#DADCE0" />
                    <Text style={styles.emptyText}>No classwork yet</Text>
                    <Button mode="contained" onPress={() => setShowCreateModal(true)} style={{ marginTop: 16 }}>
                        Create Assignment
                    </Button>
                </View>
            ) : (
                <View style={styles.contentList}>
                    {content.map((item) => (
                        <View key={item._id} style={styles.contentCard}>
                            <View style={styles.contentIcon}>
                                <MaterialCommunityIcons
                                    name={item.type === 'quiz' ? 'file-document-edit-outline' : 'book-open-variant'}
                                    size={24}
                                    color="#1967D2"
                                />
                            </View>
                            <View style={styles.contentInfo}>
                                <Text style={styles.contentTitle}>{item.title}</Text>
                                <Text style={styles.contentMeta}>
                                    {item.type === 'quiz' ? `${item.questions?.length || 0} questions` : item.subject}
                                </Text>
                            </View>
                            <View style={styles.contentActions}>
                                <TouchableOpacity
                                    onPress={() => {
                                        if (item.type === 'quiz') {
                                            (navigation as any).navigate('Quiz', { quizId: item._id });
                                        } else {
                                            (navigation as any).navigate('TeacherChapterViewer', { chapter: item });
                                        }
                                    }}
                                    style={styles.actionButton}
                                >
                                    <MaterialCommunityIcons name="eye-outline" size={20} color="#5f6368" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleDeletePress(item)} style={styles.actionButton}>
                                    <MaterialCommunityIcons name="delete-outline" size={20} color="#EA4335" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </View>
            )}

            {/* FAB for Creating Content */}
            {!loading && (
                <TouchableOpacity style={styles.fab} onPress={() => setShowCreateModal(true)}>
                    <MaterialCommunityIcons name="plus" size={24} color="#fff" />
                </TouchableOpacity>
            )}
        </ScrollView>
    );

    const renderPeopleTab = () => (
        <ScrollView style={styles.tabContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} />}>
            {/* Teachers Section */}
            <View style={styles.peopleSection}>
                <View style={styles.peopleSectionHeader}>
                    <Text style={styles.peopleSectionTitle}>Teachers</Text>
                </View>
                <View style={styles.personCard}>
                    <View style={styles.personAvatar}>
                        <Text style={styles.personAvatarText}>T</Text>
                    </View>
                    <Text style={styles.personName}>Teacher</Text>
                </View>
            </View>

            {/* Students Section */}
            <View style={styles.peopleSection}>
                <View style={styles.peopleSectionHeader}>
                    <Text style={styles.peopleSectionTitle}>Students</Text>
                    <Text style={styles.peopleCount}>{students.length}</Text>
                </View>

                {students.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="account-group-outline" size={64} color="#DADCE0" />
                        <Text style={styles.emptyText}>No students yet</Text>
                        <Button mode="contained" onPress={() => setShowAddStudentModal(true)} style={{ marginTop: 16 }}>
                            Add Student
                        </Button>
                    </View>
                ) : (
                    students.map((student) => (
                        <View key={student._id} style={styles.personCard}>
                            <View style={styles.personAvatar}>
                                <Text style={styles.personAvatarText}>
                                    {student.name?.charAt(0).toUpperCase() || 'S'}
                                </Text>
                            </View>
                            <View style={styles.personInfo}>
                                <Text style={styles.personName}>{student.name}</Text>
                                <Text style={styles.personEmail}>{student.email}</Text>
                            </View>
                            <TouchableOpacity onPress={() => handleRemoveStudent(student._id)}>
                                <MaterialCommunityIcons name="account-remove-outline" size={20} color="#EA4335" />
                            </TouchableOpacity>
                        </View>
                    ))
                )}
            </View>

            {/* FAB for Adding Students */}
            {students.length > 0 && (
                <TouchableOpacity style={styles.fab} onPress={() => setShowAddStudentModal(true)}>
                    <MaterialCommunityIcons name="account-plus" size={24} color="#fff" />
                </TouchableOpacity>
            )}
        </ScrollView>
    );

    const renderLiveTab = () => (
        <ScrollView style={styles.tabContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} />}>
            {liveClasses.length === 0 ? (
                <View style={styles.emptyState}>
                    <MaterialCommunityIcons name="video-wireless-outline" size={64} color="#DADCE0" />
                    <Text style={styles.emptyText}>No live classes scheduled</Text>
                    <Button mode="contained" onPress={() => setShowScheduleModal(true)} style={{ marginTop: 16 }} buttonColor="#D93025">
                        Schedule Live Class
                    </Button>
                </View>
            ) : (
                <View style={styles.contentList}>
                    <Button mode="contained" onPress={() => setShowScheduleModal(true)} style={{ marginBottom: 16 }} buttonColor="#D93025">
                        Schedule New Class
                    </Button>
                    {liveClasses.map((item) => (
                        <TouchableOpacity
                            key={item._id}
                            style={[styles.contentCard, { borderLeftWidth: 4, borderLeftColor: item.status === 'live' ? '#D93025' : '#1967D2' }]}
                            onPress={() => navigation.navigate('LiveClassRoom', {
                                roomId: item.roomId,
                                topic: item.topic,
                                duration: item.duration,
                                teacherId: user?._id
                            })}
                        >
                            <View style={[styles.contentIcon, { backgroundColor: item.status === 'live' ? '#FCE8E6' : '#E8F0FE' }]}>
                                <MaterialCommunityIcons
                                    name={item.status === 'live' ? "video-wireless" : "calendar-clock"}
                                    size={24}
                                    color={item.status === 'live' ? "#D93025" : "#1967D2"}
                                />
                            </View>
                            <View style={styles.contentInfo}>
                                <Text style={styles.contentTitle}>{item.topic}</Text>
                                <Text style={styles.contentMeta}>
                                    {new Date(item.startAt).toLocaleDateString()} at {new Date(item.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                                <Text style={[styles.contentMeta, { color: item.status === 'live' ? '#D93025' : '#5f6368', fontWeight: item.status === 'live' ? 'bold' : 'normal' }]}>
                                    Status: {item.status.toUpperCase()} • {item.duration} mins
                                </Text>
                            </View>
                            <View style={styles.contentActions}>
                                {item.status === 'live' && (
                                    <Button mode="contained" compact buttonColor="#D93025" onPress={() => console.log('Join/Host')}>
                                        HOST
                                    </Button>
                                )}
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </ScrollView>
    );

    if (!classroom) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Classroom not found</Text>
            </View>
        );
    }

    return (
        <ScreenBackground style={styles.container}>
            {renderHeader()}
            {renderBanner()}
            {renderTabs()}

            {activeTab === 'stream' && renderStreamTab()}
            {activeTab === 'classwork' && renderClassworkTab()}
            {activeTab === 'people' && renderPeopleTab()}
            {activeTab === 'live' && renderLiveTab()}

            {/* Create Content Modal */}
            <Modal visible={showCreateModal} transparent animationType="fade" onRequestClose={() => setShowCreateModal(false)}>
                {/* ... existing content ... */}
                <Pressable style={styles.modalOverlay} onPress={() => setShowCreateModal(false)}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Create Content</Text>
                        <TouchableOpacity style={styles.modalOption} onPress={() => handleCreateContent('quiz')}>
                            <MaterialCommunityIcons name="file-document-edit" size={24} color="#1967D2" />
                            <Text style={styles.modalOptionText}>Quiz Assignment</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.modalOption} onPress={() => handleCreateContent('chapter')}>
                            <MaterialCommunityIcons name="book-open-variant" size={24} color="#1967D2" />
                            <Text style={styles.modalOptionText}>Chapter/Material</Text>
                        </TouchableOpacity>
                        <Button mode="text" onPress={() => setShowCreateModal(false)}>Cancel</Button>
                    </View>
                </Pressable>
            </Modal>

            {/* Schedule Live Class Modal */}
            {renderScheduleModal()}

            {/* Add Student Modal */}
            <Modal visible={showAddStudentModal} transparent animationType="slide" onRequestClose={() => setShowAddStudentModal(false)}>
                {/* ... existing content ... */}
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Add Student</Text>
                        <TextInput
                            mode="outlined"
                            label="Student Email"
                            value={newStudentEmail}
                            onChangeText={setNewStudentEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            style={{ marginBottom: 16 }}
                        />
                        <View style={styles.modalButtons}>
                            <Button mode="text" onPress={() => setShowAddStudentModal(false)}>Cancel</Button>
                            <Button mode="contained" onPress={handleAddStudent} loading={addingStudent}>
                                Add
                            </Button>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Delete Dialog */}
            <Portal>
                {/* ... existing content ... */}
                <Dialog visible={showDeleteDialog} onDismiss={() => setShowDeleteDialog(false)}>
                    <Dialog.Title>Delete Content</Dialog.Title>
                    <Dialog.Content>
                        <Paragraph>Are you sure you want to delete "{itemToDelete?.title}"?</Paragraph>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setShowDeleteDialog(false)}>Cancel</Button>
                        <Button onPress={confirmDelete} textColor="#EA4335">Delete</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </ScreenBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        fontSize: 16,
        color: '#5f6368',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        paddingBottom: 8,
        backgroundColor: '#fff',
    },
    headerButton: {
        padding: 8,
    },
    headerTitle: {
        flex: 1,
        fontSize: 20,
        fontWeight: '500',
        color: '#202124',
        marginHorizontal: 16,
    },
    bannerContainer: {
        height: 200,
        overflow: 'hidden',
    },
    bannerGradient: {
        flex: 1,
    },
    bannerImage: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.3,
    },
    bannerOverlay: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        padding: 24,
    },
    bannerContent: {
        flex: 1,
    },
    bannerTitle: {
        fontSize: 32,
        fontWeight: '500',
        color: '#fff',
        marginBottom: 4,
    },
    bannerSubtitle: {
        fontSize: 16,
        color: '#fff',
        opacity: 0.9,
    },
    bannerInfoButton: {
        padding: 8,
    },
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#DADCE0',
    },
    tab: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        position: 'relative',
    },
    activeTab: {},
    tabText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#5f6368',
        letterSpacing: 0.5,
    },
    activeTabText: {
        color: '#1967D2',
    },
    tabIndicator: {
        position: 'absolute',
        bottom: 0,
        height: 3,
        width: '60%',
        backgroundColor: '#1967D2',
        borderRadius: 2,
    },
    tabContent: {
        flex: 1,
    },
    announcementCard: {
        backgroundColor: '#fff',
        padding: 16,
        marginBottom: 8,
    },
    announcementInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#0EA5E9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    announcementInput: {
        flex: 1,
        padding: 12,
        borderRadius: 24,
        backgroundColor: '#F1F3F4',
    },
    announcementPlaceholder: {
        color: '#5f6368',
        fontSize: 14,
    },
    postCard: {
        backgroundColor: '#fff',
        padding: 16,
        marginBottom: 8,
        borderRadius: 8,
        marginHorizontal: 16,
    },
    postHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    postIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E8F0FE',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    postInfo: {
        flex: 1,
    },
    postAuthor: {
        fontSize: 14,
        color: '#202124',
        marginBottom: 2,
    },
    postDate: {
        fontSize: 12,
        color: '#5f6368',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        color: '#5f6368',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#80868B',
        marginTop: 4,
    },
    contentList: {
        padding: 16,
    },
    contentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    contentIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E8F0FE',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    contentInfo: {
        flex: 1,
    },
    contentTitle: {
        fontSize: 15,
        fontWeight: '500',
        color: '#202124',
        marginBottom: 2,
    },
    contentMeta: {
        fontSize: 13,
        color: '#5f6368',
    },
    contentActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        padding: 8,
    },
    peopleSection: {
        marginBottom: 24,
    },
    peopleSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#DADCE0',
    },
    peopleSectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#202124',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    peopleCount: {
        fontSize: 13,
        color: '#5f6368',
    },
    personCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F3F4',
    },
    personAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#34A853',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    personAvatarText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    personInfo: {
        flex: 1,
    },
    personName: {
        fontSize: 15,
        fontWeight: '500',
        color: '#202124',
    },
    personEmail: {
        fontSize: 13,
        color: '#5f6368',
        marginTop: 2,
    },
    fab: {
        position: 'absolute',
        right: 16,
        bottom: 16,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#1967D2',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
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
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#202124',
        marginBottom: 20,
    },
    modalOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
        backgroundColor: '#F8F9FA',
    },
    modalOptionText: {
        fontSize: 16,
        color: '#202124',
        marginLeft: 16,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8,
    },
    // Missing Styles
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 12,
        marginBottom: 4,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    premiumInput: {
        backgroundColor: 'transparent',
        fontSize: 16,
    },
    row: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    pickerButton: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 4,
        padding: 12,
        justifyContent: 'center',
    },
    pickerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        gap: 8,
    },
    pickerText: {
        fontSize: 16,
        fontWeight: '500',
    },
    scheduleButton: {
        paddingHorizontal: 20,
    },
});

export default TeacherClassroomScreen;
