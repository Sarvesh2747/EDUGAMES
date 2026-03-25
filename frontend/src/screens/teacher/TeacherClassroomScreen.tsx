import React, { useEffect, useState, useRef } from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity, RefreshControl, ActivityIndicator, Alert, Image, Modal, Pressable, Platform, StatusBar } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import ScreenBackground from '../../components/ScreenBackground';
import { useAppTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import { fetchClassroom, addStudentToClassroom, removeStudentFromClassroom, fetchTeacherClassroomContent } from '../../services/teacherService';
import CustomDateTimePicker from '../../components/CustomDateTimePicker';
import { TextInput, Button } from 'react-native-paper';

const TeacherClassroomScreen = () => {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const { isDark } = useAppTheme();
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
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    // Tabs & Content State
    const [activeTab, setActiveTab] = useState<'stream' | 'classwork' | 'people' | 'live'>('stream');
    const [content, setContent] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAddStudentModal, setShowAddStudentModal] = useState(false);
    const [newStudentEmail, setNewStudentEmail] = useState('');
    const [addingStudent, setAddingStudent] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            await Promise.all([fetchContent(), loadClassroomDetails(), fetchLiveClasses()]);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
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

    const fetchContent = async () => {
        if (!classroom?._id) return;
        try {
            const data = await fetchTeacherClassroomContent(classroom._id);
            setContent(data);
        } catch (error) {
            console.error('Failed to fetch content', error);
        }
    };

    const loadClassroomDetails = async () => {
        if (!classroom?._id) return;
        try {
            const data = await fetchClassroom(classroom._id);
            setStudents(data.students || []);
        } catch (error) {
            console.error('Failed to fetch classroom details', error);
        }
    };

    const handleScheduleClass = async () => {
        if (!scheduleForm.topic || !scheduleForm.duration) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }

        setScheduling(true);
        try {
            const combinedDateTime = new Date(scheduleForm.date);
            combinedDateTime.setHours(scheduleForm.startTime.getHours());
            combinedDateTime.setMinutes(scheduleForm.startTime.getMinutes());

            await api.post('/live-classes/schedule', {
                classroomId: classroom._id,
                topic: scheduleForm.topic,
                startAt: combinedDateTime.toISOString(),
                duration: parseInt(scheduleForm.duration)
            });

            Alert.alert('Success', 'Class scheduled successfully');
            setShowScheduleModal(false);
            fetchLiveClasses();
        } catch (error) {
            Alert.alert('Error', 'Failed to schedule class');
        } finally {
            setScheduling(false);
        }
    };

    const handleStartClass = (classId: string) => {
        navigation.navigate('LiveClassRoom', {
            roomId: classId,
            isStudent: false,
            topic: liveClasses.find(c => c.roomId === classId)?.topic
        });
    };

    const handleAddStudent = async () => {
        if (!newStudentEmail) return;
        setAddingStudent(true);
        try {
            await addStudentToClassroom(classroom._id, newStudentEmail);
            Alert.alert('Success', 'Student added successfully');
            setNewStudentEmail('');
            setShowAddStudentModal(false);
            loadClassroomDetails();
        } catch (error) {
            Alert.alert('Error', 'Failed to add student');
        } finally {
            setAddingStudent(false);
        }
    };

    const themeStyles = {
        text: isDark ? '#F8FAFC' : '#1E293B',
        subtext: isDark ? '#94A3B8' : '#64748B',
        cardBg: isDark ? '#1E293B' : '#fff',
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0',
        tabActive: isDark ? '#818CF8' : '#4F46E5',
        tabInactive: isDark ? '#94A3B8' : '#64748B',
        inputBg: isDark ? '#334155' : '#F1F5F9',
    };

    const renderTabs = () => (
        <View style={[styles.tabContainer, { backgroundColor: isDark ? 'rgba(30,41,59,0.5)' : 'rgba(255,255,255,0.8)' }]}>
            {['stream', 'live', 'classwork', 'people'].map((tab) => {
                const isActive = activeTab === tab;
                return (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tabItem, isActive && { backgroundColor: isDark ? 'rgba(99,102,241,0.2)' : '#EEF2FF' }]}
                        onPress={() => setActiveTab(tab as any)}
                    >
                        <Text style={[
                            styles.tabText,
                            { color: isActive ? themeStyles.tabActive : themeStyles.tabInactive }
                        ]}>
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );

    const renderStreamTab = () => (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Banner */}
            <LinearGradient
                colors={['#4F46E5', '#3B82F6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.banner}
            >
                <View style={styles.bannerContent}>
                    <Text style={styles.bannerTitle}>{classroom?.subject || 'Classroom'}</Text>
                    <Text style={styles.bannerSubtitle}>{classroom?.className || 'Section A'}</Text>
                </View>
                <MaterialCommunityIcons name="information" size={24} color="rgba(255,255,255,0.7)" style={styles.bannerIcon} />
            </LinearGradient>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: themeStyles.cardBg, borderColor: themeStyles.borderColor }]} onPress={() => setShowCreateModal(true)}>
                    <View style={[styles.iconBox, { backgroundColor: '#EEF2FF' }]}>
                        <MaterialCommunityIcons name="plus" size={24} color="#4F46E5" />
                    </View>
                    <Text style={[styles.actionText, { color: themeStyles.text }]}>Create</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: themeStyles.cardBg, borderColor: themeStyles.borderColor }]} onPress={() => setShowScheduleModal(true)}>
                    <View style={[styles.iconBox, { backgroundColor: '#FEE2E2' }]}>
                        <MaterialCommunityIcons name="video-plus" size={24} color="#EF4444" />
                    </View>
                    <Text style={[styles.actionText, { color: themeStyles.text }]}>Live Class</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: themeStyles.cardBg, borderColor: themeStyles.borderColor }]} onPress={() => setShowAddStudentModal(true)}>
                    <View style={[styles.iconBox, { backgroundColor: '#DCFCE7' }]}>
                        <MaterialCommunityIcons name="account-plus" size={24} color="#10B981" />
                    </View>
                    <Text style={[styles.actionText, { color: themeStyles.text }]}>Add Student</Text>
                </TouchableOpacity>
            </View>

            {/* Recent Activity */}
            <Text style={[styles.sectionTitle, { color: themeStyles.subtext }]}>RECENT ACTIVITY</Text>
            {content.length === 0 ? (
                <Text style={[styles.emptyText, { color: themeStyles.subtext }]}>No items created yet</Text>
            ) : (
                content.slice(0, 5).map((item, index) => (
                    <Animated.View key={item._id} entering={FadeInDown.delay(index * 100)}>
                        <TouchableOpacity style={[styles.card, { backgroundColor: themeStyles.cardBg, borderColor: themeStyles.borderColor }]}>
                            <View style={[styles.iconCircle, { backgroundColor: item.type === 'quiz' ? '#EEF2FF' : '#FFF7ED' }]}>
                                <MaterialCommunityIcons
                                    name={item.type === 'quiz' ? 'clipboard-text' : 'book-open-variant'}
                                    size={24}
                                    color={item.type === 'quiz' ? '#4F46E5' : '#F97316'}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.feedTitle, { color: themeStyles.text }]}>{item.title}</Text>
                                <Text style={[styles.feedDate, { color: themeStyles.subtext }]}>
                                    Posted {new Date(item.createdAt).toLocaleDateString()}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </Animated.View>
                ))
            )}
        </ScrollView>
    );

    const renderLiveTab = () => (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={[styles.sectionTitle, { color: '#EF4444', marginBottom: 0 }]}>LIVE CLASSES</Text>
                <TouchableOpacity onPress={() => setShowScheduleModal(true)} style={styles.addBtnSmall}>
                    <MaterialCommunityIcons name="plus" size={20} color="#fff" />
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>SCHEDULE</Text>
                </TouchableOpacity>
            </View>

            {liveClasses.length === 0 ? (
                <Text style={[styles.emptyText, { color: themeStyles.subtext }]}>No classes scheduled</Text>
            ) : (
                liveClasses.map((item) => (
                    <LinearGradient
                        key={item._id}
                        colors={(item.status === 'live' ? ['rgba(239, 68, 68, 0.1)', 'rgba(239, 68, 68, 0.05)'] : [themeStyles.cardBg, themeStyles.cardBg]) as any}
                        style={[styles.card, { borderColor: item.status === 'live' ? '#EF4444' : themeStyles.borderColor, flexDirection: 'column', alignItems: 'flex-start' }]}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 12 }}>
                            <View style={[styles.iconCircle, { backgroundColor: item.status === 'live' ? '#FEE2E2' : '#EEF2FF', marginRight: 12 }]}>
                                <MaterialCommunityIcons
                                    name={item.status === 'live' ? "video-wireless" : "calendar-clock"}
                                    size={24}
                                    color={item.status === 'live' ? "#EF4444" : "#4F46E5"}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.listTitle, { color: item.status === 'live' ? '#EF4444' : themeStyles.text }]}>
                                    {item.status === 'live' ? 'LIVE NOW' : 'Scheduled'}
                                </Text>
                                <Text style={{ color: themeStyles.subtext, fontSize: 12 }}>
                                    {new Date(item.startAt).toLocaleDateString()} • {item.duration} mins
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => {/* Edit/Delete Logic */ }}>
                                <MaterialCommunityIcons name="dots-horizontal" size={24} color={themeStyles.subtext} />
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.listTitle, { color: themeStyles.text, fontSize: 18, marginBottom: 16 }]}>{item.topic}</Text>

                        <TouchableOpacity
                            style={[styles.joinBtnLarge, { backgroundColor: item.status === 'live' ? '#EF4444' : '#4F46E5', alignSelf: 'stretch', alignItems: 'center' }]}
                            onPress={() => item.status === 'live' ? handleStartClass(item.roomId) : Alert.alert('Not Live', 'This class has not started yet')}
                        >
                            <Text style={styles.joinBtnTextLarge}>
                                {item.status === 'live' ? 'JOIN CLASS' : 'START CLASS'}
                            </Text>
                        </TouchableOpacity>
                    </LinearGradient>
                ))
            )}
        </ScrollView>
    );

    const renderClassworkTab = () => (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={[styles.sectionTitle, { color: themeStyles.subtext, marginBottom: 0 }]}>CLASSWORK</Text>
                <TouchableOpacity onPress={() => setShowCreateModal(true)} style={[styles.addBtnSmall, { backgroundColor: '#4F46E5' }]}>
                    <MaterialCommunityIcons name="plus" size={20} color="#fff" />
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>CREATE</Text>
                </TouchableOpacity>
            </View>

            <View style={[styles.card, { backgroundColor: themeStyles.cardBg, borderColor: themeStyles.borderColor, padding: 0 }]}>
                {content.map((item, idx, arr) => (
                    <React.Fragment key={item._id}>
                        <TouchableOpacity style={styles.listItem}>
                            <View style={[styles.iconBox, { backgroundColor: item.type === 'quiz' ? '#EEF2FF' : '#FFF7ED' }]}>
                                <MaterialCommunityIcons
                                    name={item.type === 'quiz' ? 'clipboard-text' : 'book-open-variant'}
                                    size={20}
                                    color={item.type === 'quiz' ? '#4F46E5' : '#F97316'}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.listTitle, { color: themeStyles.text }]}>{item.title}</Text>
                                <Text style={{ color: themeStyles.subtext, fontSize: 12 }}>
                                    {item.type.toUpperCase()} • {new Date(item.createdAt).toLocaleDateString()}
                                </Text>
                            </View>
                            <MaterialCommunityIcons name="chevron-right" size={24} color={themeStyles.subtext} />
                        </TouchableOpacity>
                        {idx < arr.length - 1 && <View style={[styles.divider, { backgroundColor: themeStyles.borderColor }]} />}
                    </React.Fragment>
                ))}
            </View>
        </ScrollView>
    );

    const renderPeopleTab = () => (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={[styles.sectionTitle, { color: '#4F46E5', marginBottom: 0 }]}>STUDENTS ({students.length})</Text>
                <TouchableOpacity onPress={() => setShowAddStudentModal(true)} style={[styles.addBtnSmall, { backgroundColor: '#4F46E5' }]}>
                    <MaterialCommunityIcons name="account-plus" size={20} color="#fff" />
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>INVITE</Text>
                </TouchableOpacity>
            </View>

            <View style={[styles.card, { backgroundColor: themeStyles.cardBg, borderColor: themeStyles.borderColor }]}>
                {students.map((student, i) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 }}>
                        <View style={[styles.avatarMedium, { backgroundColor: `hsl(${i * 45}, 70%, 50%)`, justifyContent: 'center', alignItems: 'center' }]}>
                            <Text style={{ color: '#fff', fontWeight: 'bold' }}>{(student.name || 'S').charAt(0)}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.listTitle, { color: themeStyles.text }]}>{student.name || student.email}</Text>
                            <Text style={{ color: themeStyles.subtext, fontSize: 12 }}>{student.email}</Text>
                        </View>
                        <TouchableOpacity onPress={() => {/* Remove Logic */ }}>
                            <MaterialCommunityIcons name="delete-outline" size={24} color="#EF4444" />
                        </TouchableOpacity>
                    </View>
                ))}
            </View>
        </ScrollView>
    );

    return (
        <ScreenBackground style={styles.container}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />

            {/* Header */}
            <LinearGradient
                colors={isDark ? ['#0A1628', '#1E293B'] : ['#6366F1', '#8B5CF6']}
                style={[styles.header, { paddingTop: insets.top + 16 }]}
            >
                <View style={styles.centerContainer}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle} numberOfLines={1}>{classroom?.subject || 'Classroom'}</Text>
                        <TouchableOpacity style={styles.iconBtn}>
                            <MaterialCommunityIcons name="cog" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>
                    {renderTabs()}
                </View>
            </LinearGradient>

            {/* Content */}
            <View style={styles.centerContainer}>
                <View style={styles.content}>
                    {activeTab === 'stream' && renderStreamTab()}
                    {activeTab === 'live' && renderLiveTab()}
                    {activeTab === 'classwork' && renderClassworkTab()}
                    {activeTab === 'people' && renderPeopleTab()}
                </View>
            </View>

            {/* Modals */}
            <Modal visible={showCreateModal} transparent animationType="fade" onRequestClose={() => setShowCreateModal(false)}>
                <Pressable style={styles.modalOverlay} onPress={() => setShowCreateModal(false)}>
                    <Pressable style={[styles.modalCard, { backgroundColor: themeStyles.cardBg }]} onPress={(e) => e.stopPropagation()}>
                        <Text style={[styles.modalTitle, { color: themeStyles.text }]}>Create Content</Text>
                        <TouchableOpacity style={styles.modalOption} onPress={() => { setShowCreateModal(false); navigation.navigate('TeacherQuizCreator', { classroomId: classroom._id }); }}>
                            <View style={[styles.iconBox, { backgroundColor: '#EEF2FF' }]}>
                                <MaterialCommunityIcons name="clipboard-text-outline" size={24} color="#4F46E5" />
                            </View>
                            <Text style={[styles.modalOptionText, { color: themeStyles.text }]}>Quiz / Assignment</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.modalOption} onPress={() => { setShowCreateModal(false); /* Nav to material */ }}>
                            <View style={[styles.iconBox, { backgroundColor: '#FFF7ED' }]}>
                                <MaterialCommunityIcons name="book-open-variant" size={24} color="#F97316" />
                            </View>
                            <Text style={[styles.modalOptionText, { color: themeStyles.text }]}>Study Material</Text>
                        </TouchableOpacity>
                    </Pressable>
                </Pressable>
            </Modal>

            <Modal visible={showScheduleModal} transparent animationType="fade" onRequestClose={() => setShowScheduleModal(false)}>
                <Pressable style={styles.modalOverlay} onPress={() => setShowScheduleModal(false)}>
                    <Pressable style={[styles.modalCard, { backgroundColor: themeStyles.cardBg }]} onPress={(e) => e.stopPropagation()}>
                        <Text style={[styles.modalTitle, { color: themeStyles.text }]}>Schedule Live Class</Text>

                        <TextInput
                            label="Topic"
                            value={scheduleForm.topic}
                            onChangeText={(t) => setScheduleForm({ ...scheduleForm, topic: t })}
                            style={{ backgroundColor: themeStyles.inputBg, marginBottom: 12 }}
                            textColor={themeStyles.text}
                        />
                        <TextInput
                            label="Duration (mins)"
                            value={scheduleForm.duration}
                            onChangeText={(t) => setScheduleForm({ ...scheduleForm, duration: t })}
                            keyboardType="numeric"
                            style={{ backgroundColor: themeStyles.inputBg, marginBottom: 16 }}
                            textColor={themeStyles.text}
                        />

                        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
                            <Button mode="outlined" onPress={() => setShowDatePicker(true)} style={{ flex: 1 }}>
                                {scheduleForm.date.toLocaleDateString()}
                            </Button>
                            <Button mode="outlined" onPress={() => setShowTimePicker(true)} style={{ flex: 1 }}>
                                {scheduleForm.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Button>
                        </View>

                        <Button mode="contained" loading={scheduling} onPress={handleScheduleClass} style={{ backgroundColor: '#4F46E5' }}>
                            SCHEDULE
                        </Button>

                        {showDatePicker && (
                            <CustomDateTimePicker
                                value={scheduleForm.date}
                                mode="date"
                                onChange={(d) => { setShowDatePicker(false); if (d) setScheduleForm({ ...scheduleForm, date: d }); }}
                                onClose={() => setShowDatePicker(false)}
                            />
                        )}
                        {showTimePicker && (
                            <CustomDateTimePicker
                                value={scheduleForm.startTime}
                                mode="time"
                                onChange={(d) => { setShowTimePicker(false); if (d) setScheduleForm({ ...scheduleForm, startTime: d }); }}
                                onClose={() => setShowTimePicker(false)}
                            />
                        )}
                    </Pressable>
                </Pressable>
            </Modal>

            <Modal visible={showAddStudentModal} transparent animationType="fade" onRequestClose={() => setShowAddStudentModal(false)}>
                <Pressable style={styles.modalOverlay} onPress={() => setShowAddStudentModal(false)}>
                    <Pressable style={[styles.modalCard, { backgroundColor: themeStyles.cardBg }]} onPress={(e) => e.stopPropagation()}>
                        <Text style={[styles.modalTitle, { color: themeStyles.text }]}>Add Student</Text>
                        <TextInput
                            label="Student Email"
                            value={newStudentEmail}
                            onChangeText={setNewStudentEmail}
                            style={{ backgroundColor: themeStyles.inputBg, marginBottom: 20 }}
                            textColor={themeStyles.text}
                            autoCapitalize="none"
                        />
                        <Button mode="contained" loading={addingStudent} onPress={handleAddStudent} style={{ backgroundColor: '#10B981' }}>
                            INVITE STUDENT
                        </Button>
                    </Pressable>
                </Pressable>
            </Modal>

        </ScreenBackground>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    centerContainer: {
        width: '100%',
        maxWidth: 1000,
        alignSelf: 'center',
        flex: 1,
    },
    header: { paddingBottom: 16 },
    headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 16 },
    iconBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12 },
    headerTitle: { flex: 1, textAlign: 'center', color: '#fff', fontSize: 18, fontWeight: '700', marginHorizontal: 12 },

    tabContainer: { flexDirection: 'row', marginHorizontal: 16, padding: 4, borderRadius: 16 },
    tabItem: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12 },
    tabText: { fontWeight: '700', fontSize: 12 },

    content: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 100 },

    // Stream
    banner: { height: 140, borderRadius: 24, padding: 20, justifyContent: 'flex-end', marginBottom: 20 },
    bannerContent: { zIndex: 2 },
    bannerTitle: { color: '#fff', fontSize: 24, fontWeight: '800' },
    bannerSubtitle: { color: 'rgba(255,255,255,0.9)', fontSize: 14, marginTop: 4 },
    bannerIcon: { position: 'absolute', top: 16, right: 16 },

    quickActions: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    actionBtn: { flex: 1, padding: 12, borderRadius: 16, borderWidth: 1, alignItems: 'center' },
    actionText: { fontWeight: '600', marginTop: 8, fontSize: 12 },

    card: { borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, flexDirection: 'row', alignItems: 'center' },

    feedTitle: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
    feedDate: { fontSize: 12, marginTop: 4 },
    iconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },

    emptyText: { textAlign: 'center', marginTop: 40 },

    // Section Headers
    sectionTitle: { fontSize: 12, fontWeight: '700', marginBottom: 12, letterSpacing: 1 },
    addBtnSmall: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EF4444', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 4 },

    // List Items
    listItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 16 },
    iconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    listTitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
    divider: { height: 1, marginLeft: 68 },
    avatarMedium: { width: 40, height: 40, borderRadius: 20 },

    // Live Classes
    joinBtnLarge: { backgroundColor: '#EF4444', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
    joinBtnTextLarge: { color: '#fff', fontWeight: '800', fontSize: 12 },

    // Modals
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
    modalCard: { borderRadius: 24, padding: 24, width: '100%', maxWidth: 500, alignSelf: 'center' },
    modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 20, textAlign: 'center' },
    modalOption: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
    modalOptionText: { fontSize: 16, fontWeight: '600', marginLeft: 16 },
});

export default TeacherClassroomScreen;
