import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ScrollView, Modal, ActivityIndicator, Linking, Alert, ScrollView as NativeScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { theme, gradients, spacing, borderRadius } from '../theme';
import { useTranslation } from '../i18n';
import { fetchClassroomContent, ClassroomItem, fetchStudentLiveClasses, LiveClassItem } from '../services/studentService';
import { Surface, Button, IconButton, useTheme, Dialog, Portal, Paragraph } from 'react-native-paper';
import ScreenBackground from '../components/ScreenBackground';

const ClassroomScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>(); // Add useRoute
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const [activeTab, setActiveTab] = useState<'stream' | 'classwork' | 'people' | 'meets'>('stream');
    const [classroomContent, setClassroomContent] = useState<ClassroomItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedChapter, setSelectedChapter] = useState<ClassroomItem | null>(null);

    const [meta, setMeta] = useState({
        className: 'Loading...',
        schoolName: '',
        teachers: [] as any[]
    });

    // Live Classes State
    const [liveClasses, setLiveClasses] = useState<LiveClassItem[]>([]);
    const [loadingLive, setLoadingLive] = useState(false);

    React.useEffect(() => {
        loadContent();
    }, [route.params?.subject]); // Reload if subject changes

    const loadContent = async () => {
        try {
            setLoading(true);
            const subject = route.params?.subject;

            // Fetch Classroom Content
            const data = await fetchClassroomContent(subject);
            setClassroomContent(data.content);
            setMeta(data.meta);

            // Fetch Live Classes
            fetchLiveClasses(subject);
        } catch (error) {
            console.error('Failed to load classroom content', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchLiveClasses = async (subject?: string) => {
        try {
            setLoadingLive(true);
            const data = await fetchStudentLiveClasses(subject);
            setLiveClasses(data);
        } catch (error) {
            console.error('Failed to load live classes', error);
        } finally {
            setLoadingLive(false);
        }
    };

    const handleItemPress = (item: ClassroomItem) => {
        if (item.type === 'quiz' && item.questions) {
            navigation.navigate('Quiz', {
                quizData: {
                    id: item.id,
                    quizId: item.id,
                    questions: item.questions,
                    title: item.title
                }
            });
        } else if (item.type === 'chapter') {
            setSelectedChapter(item);
        }
    };

    const handleJoinLiveClass = (item: LiveClassItem) => {
        navigation.navigate('LiveClassRoom', {
            roomId: item.roomId,
            topic: item.topic,
            duration: item.duration,
            isStudent: true // Flag to hide teacher controls if needed
        });
    };

    const renderStreamTab = () => (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
            {/* Banner */}
            <View style={styles.bannerContainer}>
                <Image
                    source={{ uri: 'https://gstatic.com/classroom/themes/img_code.jpg' }} // Generic coding theme image
                    style={styles.bannerImage}
                />
                <View style={styles.bannerOverlay} />
                <View style={styles.bannerContent}>
                    <Text style={styles.bannerTitle}>{meta.className}</Text>
                    <Text style={styles.bannerSubtitle}>{meta.schoolName}</Text>
                </View>
                <TouchableOpacity style={styles.bannerInfoBtn}>
                    <MaterialCommunityIcons name="information-outline" size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Announcement Box placeholder */}
            <Surface style={styles.announcementBox} elevation={1}>
                <Image
                    source={{ uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(meta.className)}&background=random` }}
                    style={styles.tinyAvatar}
                />
                <Text style={styles.announcementPlaceholder}>Share with your class...</Text>
            </Surface>

            {/* Live Class Pinned */}
            {liveClasses.some(c => c.status === 'live') && (
                <Surface style={styles.liveStreamCard} elevation={1}>
                    <View style={styles.liveHeader}>
                        <MaterialCommunityIcons name="video-wireless" size={24} color="#d93025" />
                        <Text style={styles.liveTitle}>Live Class Now</Text>
                    </View>
                    <Text style={styles.liveBody}>Topic: {liveClasses.find(c => c.status === 'live')?.topic}</Text>
                    <TouchableOpacity style={styles.joinBtn}>
                        <Text style={styles.joinBtnText}>JOIN</Text>
                    </TouchableOpacity>
                </Surface>
            )}

            {/* Stream List */}
            <View style={styles.streamList}>
                {loading ? (
                    <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginTop: 20 }} />
                ) : classroomContent.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No classwork yet</Text>
                    </View>
                ) : (
                    classroomContent.map((item, index) => (
                        <Animated.View key={item.id} entering={FadeInDown.delay(index * 50)}>
                            <Surface style={[styles.streamItem, { opacity: item.status === 'completed' ? 0.6 : 1 }]} elevation={1}>
                                <TouchableOpacity onPress={() => handleItemPress(item)} style={styles.streamTouchable} activeOpacity={0.7}>
                                    <View style={[styles.streamIconCircle, { backgroundColor: item.type === 'quiz' ? '#1967d2' : '#e37400' }]}>
                                        <MaterialCommunityIcons
                                            name={item.type === 'quiz' ? 'clipboard-text' : 'book-open-variant'}
                                            size={24}
                                            color="#fff"
                                        />
                                    </View>
                                    <View style={styles.streamTextContent}>
                                        <Text style={styles.streamTitle}>
                                            {item.teacher} posted a new {item.type === 'quiz' ? 'assignment' : 'material'}: {item.title}
                                        </Text>
                                        <Text style={styles.streamDate}>{new Date(item.date).toLocaleDateString()}</Text>
                                    </View>
                                    {item.status === 'completed' && (
                                        <MaterialCommunityIcons name="check" size={20} color="#137333" />
                                    )}
                                </TouchableOpacity>
                            </Surface>
                        </Animated.View>
                    ))
                )}
            </View>
        </ScrollView>
    );

    const renderMeetsTab = () => (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            <View style={styles.topicSection}>
                <Text style={[styles.topicTitle, { color: '#d93025', fontSize: 24, marginBottom: 16 }]}>Live Classes</Text>
                <View style={[styles.topicDivider, { backgroundColor: '#d93025' }]} />

                {loadingLive ? (
                    <ActivityIndicator size="large" color="#d93025" style={{ marginTop: 20 }} />
                ) : liveClasses.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <MaterialCommunityIcons name="video-off" size={64} color="#dadce0" />
                        <Text style={[styles.emptyText, { marginTop: 16 }]}>No scheduled live classes</Text>
                    </View>
                ) : (
                    liveClasses.map((item) => (
                        <Surface key={item._id} style={[styles.liveStreamCard, { borderColor: item.status === 'live' ? '#d93025' : '#1967d2', borderLeftWidth: 4 }]} elevation={2}>
                            <View style={styles.liveHeader}>
                                <MaterialCommunityIcons
                                    name={item.status === 'live' ? "video-wireless" : "calendar-clock"}
                                    size={24}
                                    color={item.status === 'live' ? "#d93025" : "#1967d2"}
                                />
                                <Text style={[styles.liveTitle, { color: item.status === 'live' ? '#d93025' : '#1967d2' }]}>
                                    {item.status === 'live' ? 'LIVE NOW' : 'Scheduled'}
                                </Text>
                            </View>

                            <Text style={[styles.liveBody, { fontSize: 18, fontWeight: 'bold', marginBottom: 4 }]}>{item.topic}</Text>
                            <Text style={[styles.contentMeta, { marginBottom: 16 }]}>
                                {new Date(item.startAt).toLocaleDateString()} at {new Date(item.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {item.duration} mins
                            </Text>

                            <TouchableOpacity
                                style={[styles.joinBtn, { backgroundColor: item.status === 'live' ? '#d93025' : '#1967d2', opacity: item.status === 'completed' ? 0.5 : 1 }]}
                                onPress={() => handleJoinLiveClass(item)}
                                disabled={item.status === 'completed'}
                            >
                                <Text style={styles.joinBtnText}>
                                    {item.status === 'live' ? 'JOIN NOW' : (item.status === 'completed' ? 'COMPLETED' : 'JOIN')}
                                </Text>
                            </TouchableOpacity>
                        </Surface>
                    ))
                )}
            </View>
        </ScrollView>
    );

    const renderClassworkTab = () => (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
            {/* Resources Section */}
            <View style={styles.topicSection}>
                <Text style={styles.topicTitle}>Quick Access</Text>
                <View style={styles.topicDivider} />

                <TouchableOpacity style={styles.classworkItem} onPress={() => navigation.navigate('VideoLibrary')}>
                    <View style={[styles.classworkIcon, { backgroundColor: '#d93025' }]}>
                        <Ionicons name="logo-youtube" size={20} color="#fff" />
                    </View>
                    <View style={styles.classworkInfo}>
                        <Text style={styles.classworkTitle}>YouTube Video Library</Text>
                        <Text style={styles.classworkSubtitle}>External Resources</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.classworkItem} onPress={() => navigation.navigate('StudentOnlineAssignments')}>
                    <View style={[styles.classworkIcon, { backgroundColor: '#188038' }]}>
                        <Ionicons name="desktop-outline" size={20} color="#fff" />
                    </View>
                    <View style={styles.classworkInfo}>
                        <Text style={styles.classworkTitle}>E-Learning Modules</Text>
                        <Text style={styles.classworkSubtitle}>Interactive Content</Text>
                    </View>
                </TouchableOpacity>
            </View>

            {/* Quizzes Section */}
            {classroomContent.some(i => i.type === 'quiz') && (
                <View style={styles.topicSection}>
                    <Text style={styles.topicTitle}>Assignments & Quizzes</Text>
                    <View style={styles.topicDivider} />
                    {classroomContent.filter(i => i.type === 'quiz').map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={[styles.classworkItem, item.status === 'completed' && { opacity: 0.5 }]}
                            onPress={() => handleItemPress(item)}
                        >
                            <View style={[styles.classworkIcon, { backgroundColor: item.status === 'completed' ? '#bdc1c6' : '#1967d2' }]}>
                                <MaterialCommunityIcons name="clipboard-text" size={20} color="#fff" />
                            </View>
                            <View style={styles.classworkInfo}>
                                <Text style={[styles.classworkTitle, item.status === 'completed' && { textDecorationLine: 'line-through' }]}>{item.title}</Text>
                                <Text style={styles.classworkSubtitle}>Due {new Date(item.date).toLocaleDateString()}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Chapters Section */}
            {classroomContent.some(i => i.type === 'chapter') && (
                <View style={styles.topicSection}>
                    <Text style={styles.topicTitle}>Reading Materials</Text>
                    <View style={styles.topicDivider} />
                    {classroomContent.filter(i => i.type === 'chapter').map((item) => (
                        <TouchableOpacity key={item.id} style={styles.classworkItem} onPress={() => handleItemPress(item)}>
                            <View style={[styles.classworkIcon, { backgroundColor: '#e37400' }]}>
                                <MaterialCommunityIcons name="book-open-variant" size={20} color="#fff" />
                            </View>
                            <View style={styles.classworkInfo}>
                                <Text style={styles.classworkTitle}>{item.title}</Text>
                                <Text style={styles.classworkSubtitle}>Posted {new Date(item.date).toLocaleDateString()}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </ScrollView>
    );

    const renderPeopleTab = () => (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            <View style={styles.topicSection}>
                <Text style={[styles.topicTitle, { color: '#1967d2', fontSize: 24, marginBottom: 16 }]}>Teachers</Text>
                <View style={[styles.topicDivider, { backgroundColor: '#1967d2' }]} />

                {meta.teachers.map((teacher, index) => (
                    <View key={index} style={styles.peopleItem}>
                        <Image source={{ uri: teacher.avatar }} style={styles.peopleAvatar} />
                        <View style={styles.peopleInfo}>
                            <Text style={styles.peopleName}>{teacher.name}</Text>
                            <Text style={styles.peopleRole}>{teacher.subject}</Text>
                        </View>
                        <TouchableOpacity>
                            <MaterialCommunityIcons name="email-outline" size={20} color="#5f6368" />
                        </TouchableOpacity>
                    </View>
                ))}
            </View>

            <View style={[styles.topicSection, { marginTop: 40 }]}>
                <Text style={[styles.topicTitle, { color: '#1967d2', fontSize: 24, marginBottom: 16 }]}>Classmates</Text>
                <View style={[styles.topicDivider, { backgroundColor: '#1967d2' }]} />
                {/* Mock Classmates */}
                <View style={styles.peopleItem}>
                    <View style={[styles.peopleAvatar, { backgroundColor: '#1e88e5', justifyContent: 'center', alignItems: 'center' }]}>
                        <Text style={{ color: '#fff', fontWeight: 'bold' }}>J</Text>
                    </View>
                    <Text style={styles.peopleName}>John Doe</Text>
                </View>
                <View style={styles.peopleItem}>
                    <View style={[styles.peopleAvatar, { backgroundColor: '#c2185b', justifyContent: 'center', alignItems: 'center' }]}>
                        <Text style={{ color: '#fff', fontWeight: 'bold' }}>S</Text>
                    </View>
                    <Text style={styles.peopleName}>Sarah Smith</Text>
                </View>
            </View>
        </ScrollView>
    );

    return (
        <ScreenBackground style={styles.container}>
            <View style={styles.safeArea}>
                {/* Top Navigation Bar */}
                <View style={[styles.navBar, { paddingTop: insets.top + spacing.sm }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navButton}>
                            <MaterialCommunityIcons name="arrow-left" size={24} color="#5f6368" />
                        </TouchableOpacity>
                        <Text style={styles.navTitle} numberOfLines={1}>{meta.className}</Text>
                    </View>
                    <TouchableOpacity style={styles.navButton}>
                        <MaterialCommunityIcons name="dots-vertical" size={24} color="#5f6368" />
                    </TouchableOpacity>
                </View>

                {/* Tabs Header */}
                <View style={styles.tabHeader}>
                    <TouchableOpacity
                        style={[styles.tabItem, activeTab === 'stream' && styles.tabItemActive]}
                        onPress={() => setActiveTab('stream')}
                    >
                        <Text style={[styles.tabText, activeTab === 'stream' && styles.tabTextActive]}>Stream</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tabItem, activeTab === 'meets' && styles.tabItemActive]}
                        onPress={() => setActiveTab('meets')}
                    >
                        <Text style={[styles.tabText, activeTab === 'meets' && styles.tabTextActive]}>Meets</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tabItem, activeTab === 'classwork' && styles.tabItemActive]}
                        onPress={() => setActiveTab('classwork')}
                    >
                        <Text style={[styles.tabText, activeTab === 'classwork' && styles.tabTextActive]}>Classwork</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tabItem, activeTab === 'people' && styles.tabItemActive]}
                        onPress={() => setActiveTab('people')}
                    >
                        <Text style={[styles.tabText, activeTab === 'people' && styles.tabTextActive]}>People</Text>
                    </TouchableOpacity>
                </View>

                {/* Main Content Area */}
                <View style={styles.contentArea}>
                    <View style={styles.centeredContent}>
                        {activeTab === 'stream' && renderStreamTab()}
                        {activeTab === 'meets' && renderMeetsTab()}
                        {activeTab === 'classwork' && renderClassworkTab()}
                        {activeTab === 'people' && renderPeopleTab()}
                    </View>
                </View>
            </View>

            {/* Chapter Viewer Modal */}
            <Modal visible={!!selectedChapter} animationType="fade" transparent={true} onRequestClose={() => setSelectedChapter(null)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <View style={styles.modalHeaderLeft}>
                                <MaterialCommunityIcons name="book-open-variant" size={24} color="#1967d2" />
                                <Text style={styles.modalTitle} numberOfLines={1}>{selectedChapter?.title}</Text>
                            </View>
                            <TouchableOpacity onPress={() => setSelectedChapter(null)} style={styles.closeButton}>
                                <MaterialCommunityIcons name="close" size={24} color="#5f6368" />
                            </TouchableOpacity>
                        </View>
                        <NativeScrollView contentContainerStyle={styles.modalContent}>
                            <Text style={styles.contentMeta}>
                                {selectedChapter?.teacher} • {new Date(selectedChapter?.date || Date.now()).toLocaleDateString()}
                            </Text>
                            <View style={styles.divider} />
                            <Text style={styles.contentText}>{selectedChapter?.fullContent || selectedChapter?.description}</Text>
                        </NativeScrollView>
                    </View>
                </View>
            </Modal>
        </ScreenBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    navBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        backgroundColor: '#fff',
    },
    navButton: {
        padding: 12,
    },
    navTitle: {
        fontSize: 18,
        color: '#3c4043',
        fontWeight: '500',
        marginLeft: 8,
        maxWidth: 200,
    },
    tabHeader: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        elevation: 2,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 3,
        borderBottomColor: 'transparent',
    },
    tabItemActive: {
        borderBottomColor: '#1967d2',
    },
    tabText: {
        textTransform: 'uppercase',
        fontSize: 14,
        fontWeight: '600',
        color: '#5f6368',
    },
    tabTextActive: {
        color: '#1967d2',
    },
    contentArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    centeredContent: {
        flex: 1,
        maxWidth: 900,
        width: '100%',
        alignSelf: 'center',
    },
    tabContent: {
        flex: 1,
        padding: spacing.md,
    },

    // STREAM STYLES
    bannerContainer: {
        height: 140,
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 24,
        position: 'relative',
        backgroundColor: '#1967d2', // Fallback
    },
    bannerImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    bannerOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)', // Darker so text pops
    },
    bannerContent: {
        position: 'absolute',
        bottom: 16,
        left: 16,
        right: 16,
    },
    bannerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    bannerSubtitle: {
        fontSize: 14,
        color: '#fff',
        fontWeight: '500',
    },
    bannerInfoBtn: {
        position: 'absolute',
        top: 12,
        right: 12,
        padding: 8,
    },
    announcementBox: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#dadce0',
        shadowColor: '#000',
        shadowOpacity: 0.05,
    },
    tinyAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 12,
    },
    announcementPlaceholder: {
        color: '#80868b',
        fontSize: 13,
    },
    streamList: {
        paddingBottom: 20,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        color: '#5f6368',
    },
    streamItem: {
        backgroundColor: '#fff',
        borderRadius: 8,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#dadce0',
    },
    streamTouchable: {
        flexDirection: 'row',
        padding: 16,
        alignItems: 'center',
    },
    streamIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    streamTextContent: {
        flex: 1,
    },
    streamTitle: {
        fontSize: 14,
        color: '#3c4043',
        fontWeight: '500',
        lineHeight: 20,
    },
    streamDate: {
        fontSize: 12,
        color: '#5f6368',
        marginTop: 2,
    },
    liveStreamCard: {
        backgroundColor: '#fff',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#d93025',
        borderRadius: 8,
        padding: 16,
    },
    liveHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    liveTitle: {
        color: '#d93025',
        fontWeight: 'bold',
        marginLeft: 8,
    },
    liveBody: {
        fontSize: 14,
        color: '#3c4043',
        marginBottom: 12,
    },
    joinBtn: {
        backgroundColor: '#d93025',
        alignSelf: 'flex-start',
        paddingHorizontal: 20,
        paddingVertical: 6,
        borderRadius: 4,
    },
    joinBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 13,
    },

    // CLASSWORK STYLES
    topicSection: {
        marginBottom: 32,
    },
    topicTitle: {
        fontSize: 20,
        color: '#1967d2',
        marginBottom: 12,
        paddingHorizontal: 8,
    },
    topicDivider: {
        height: 1,
        backgroundColor: '#1967d2',
        marginBottom: 16,
        marginHorizontal: 8,
        width: 100, // Partial underline effect
    },
    classworkItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f3f4',
    },
    classworkIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    classworkInfo: {
        flex: 1,
    },
    classworkTitle: {
        fontSize: 14,
        color: '#3c4043',
        fontWeight: '500',
    },
    classworkSubtitle: {
        fontSize: 12,
        color: '#5f6368',
        marginTop: 2,
    },

    // PEOPLE STYLES
    peopleItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    peopleAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 16,
    },
    peopleInfo: {
        flex: 1,
    },
    peopleName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#3c4043',
    },
    peopleRole: {
        fontSize: 12,
        color: '#5f6368',
    },

    // MODAL
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
    },
    modalContainer: {
        backgroundColor: '#fff',
        margin: spacing.lg,
        borderRadius: 8,
        maxHeight: '80%',
        maxWidth: 800,
        alignSelf: 'center',
        width: '100%',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: '#dadce0',
    },
    modalHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    closeButton: {
        padding: 4,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '400',
        color: '#3c4043',
        marginLeft: 12,
    },
    modalContent: {
        padding: spacing.lg,
    },
    contentMeta: {
        fontSize: 12,
        color: '#5f6368',
        marginBottom: spacing.md,
    },
    divider: {
        height: 1,
        backgroundColor: '#dadce0',
    },
    contentText: {
        fontSize: 14,
        color: '#3c4043',
        lineHeight: 22,
    },
});

export default ClassroomScreen;
