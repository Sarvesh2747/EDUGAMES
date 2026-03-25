import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Modal, Pressable, Platform, StatusBar } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import ScreenBackground from '../components/ScreenBackground';
import { fetchClassroomContent, ClassroomItem, fetchStudentLiveClasses, LiveClassItem } from '../services/studentService';
import { useAppTheme } from '../context/ThemeContext';

const ClassroomScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const insets = useSafeAreaInsets();
    const { isDark } = useAppTheme();
    const [activeTab, setActiveTab] = useState<'stream' | 'classwork' | 'people' | 'meets'>(route.params?.initialTab || 'stream');
    const [classroomContent, setClassroomContent] = useState<ClassroomItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedChapter, setSelectedChapter] = useState<ClassroomItem | null>(null);
    const [meta, setMeta] = useState({
        className: 'Loading...',
        schoolName: '',
        teachers: [] as any[]
    });
    const [liveClasses, setLiveClasses] = useState<LiveClassItem[]>([]);
    const [loadingLive, setLoadingLive] = useState(false);

    useEffect(() => {
        loadContent();
        if (route.params?.initialTab) {
            setActiveTab(route.params.initialTab);
        }
    }, [route.params?.subject, route.params?.initialTab]);

    const loadContent = async () => {
        try {
            setLoading(true);
            const subject = route.params?.subject;
            const data = await fetchClassroomContent(subject);
            setClassroomContent(data.content);
            setMeta(data.meta);
            fetchLiveClasses(subject);
        } catch (error) {
            console.error(error);
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
            console.error(error);
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
            isStudent: true
        });
    };

    const themeStyles = {
        text: isDark ? '#F8FAFC' : '#1E293B',
        subtext: isDark ? '#94A3B8' : '#64748B',
        cardBg: isDark ? '#1E293B' : '#fff',
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0',
        tabActive: isDark ? '#818CF8' : '#4F46E5',
        tabInactive: isDark ? '#94A3B8' : '#64748B',
    };

    const renderTabs = () => (
        <View style={[styles.tabContainer, { backgroundColor: isDark ? 'rgba(30,41,59,0.5)' : 'rgba(255,255,255,0.8)' }]}>
            {['stream', 'meets', 'classwork', 'people'].map((tab) => {
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
                    <Text style={styles.bannerTitle}>{meta.className}</Text>
                    <Text style={styles.bannerSubtitle}>{meta.schoolName}</Text>
                </View>
                <MaterialCommunityIcons name="information" size={24} color="rgba(255,255,255,0.7)" style={styles.bannerIcon} />
            </LinearGradient>

            {/* Announcement Input */}
            <View style={[styles.card, { backgroundColor: themeStyles.cardBg, borderColor: themeStyles.borderColor }]}>
                <Image
                    source={{ uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(meta.className)}&background=random` }}
                    style={styles.avatarSmall}
                />
                <Text style={{ color: themeStyles.subtext, flex: 1, marginLeft: 12 }}>Share something with your class...</Text>
            </View>

            {/* Live Class Pinned */}
            {liveClasses.some(c => c.status === 'live') && (
                <LinearGradient
                    colors={['rgba(220, 38, 38, 0.1)', 'rgba(220, 38, 38, 0.05)']}
                    style={[styles.card, { borderColor: '#EF4444', borderWidth: 1 }]}
                >
                    <View style={styles.liveHeader}>
                        <View style={styles.liveBadge}>
                            <Text style={styles.liveBadgeText}>LIVE NOW</Text>
                        </View>
                        <Text style={[styles.liveTopic, { color: themeStyles.text }]}>{liveClasses.find(c => c.status === 'live')?.topic}</Text>
                    </View>
                    <TouchableOpacity style={styles.joinBtnLarge}>
                        <Text style={styles.joinBtnTextLarge}>JOIN CLASS</Text>
                    </TouchableOpacity>
                </LinearGradient>
            )}

            {/* Feed */}
            {loading ? (
                <ActivityIndicator color="#4F46E5" style={{ marginTop: 20 }} />
            ) : classroomContent.length === 0 ? (
                <Text style={[styles.emptyText, { color: themeStyles.subtext }]}>No updates yet</Text>
            ) : (
                classroomContent.map((item, index) => (
                    <Animated.View key={item.id} entering={FadeInDown.delay(index * 100)}>
                        <TouchableOpacity
                            style={[styles.card, { backgroundColor: themeStyles.cardBg, borderColor: themeStyles.borderColor }]}
                            onPress={() => handleItemPress(item)}
                        >
                            <View style={[styles.iconCircle, { backgroundColor: item.type === 'quiz' ? '#EEF2FF' : '#FFF7ED' }]}>
                                <MaterialCommunityIcons
                                    name={item.type === 'quiz' ? 'clipboard-text' : 'book-open-variant'}
                                    size={24}
                                    color={item.type === 'quiz' ? '#4F46E5' : '#F97316'}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.feedTitle, { color: themeStyles.text }]}>
                                    <Text style={{ fontWeight: '700' }}>{item.teacher}</Text> posted a new {item.type}: {item.title}
                                </Text>
                                <Text style={[styles.feedDate, { color: themeStyles.subtext }]}>{new Date(item.date).toLocaleDateString()}</Text>
                            </View>
                        </TouchableOpacity>
                    </Animated.View>
                ))
            )}
        </ScrollView>
    );

    const renderMeetsTab = () => (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <Text style={[styles.sectionTitle, { color: '#EF4444', marginBottom: 8 }]}>LIVE CLASSES</Text>
            {loadingLive ? (
                <ActivityIndicator color="#EF4444" style={{ marginTop: 20 }} />
            ) : liveClasses.length === 0 ? (
                <Text style={[styles.emptyText, { color: themeStyles.subtext }]}>No classes scheduled</Text>
            ) : (
                liveClasses.map((item) => (
                    <LinearGradient
                        key={item._id}
                        colors={(item.status === 'live' ? ['rgba(239, 68, 68, 0.1)', 'rgba(239, 68, 68, 0.05)'] : [themeStyles.cardBg, themeStyles.cardBg]) as any}
                        style={[styles.card, { borderColor: item.status === 'live' ? '#EF4444' : themeStyles.borderColor, flexDirection: 'column', alignItems: 'flex-start' }]}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 16 }}>
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
                        </View>

                        <Text style={[styles.listTitle, { color: themeStyles.text, fontSize: 18, marginBottom: 12 }]}>{item.topic}</Text>

                        <TouchableOpacity
                            style={[styles.joinBtnLarge, { backgroundColor: item.status === 'live' ? '#EF4444' : '#4F46E5', alignSelf: 'stretch', alignItems: 'center' }]}
                            onPress={() => handleJoinLiveClass(item)}
                        >
                            <Text style={styles.joinBtnTextLarge}>
                                {item.status === 'live' ? 'JOIN NOW' : 'JOIN'}
                            </Text>
                        </TouchableOpacity>
                    </LinearGradient>
                ))
            )}
        </ScrollView>
    );

    const renderClassworkTab = () => (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Quick Access */}
            <Text style={[styles.sectionTitle, { color: themeStyles.subtext }]}>QUICK ACCESS</Text>
            <View style={[styles.card, { backgroundColor: themeStyles.cardBg, borderColor: themeStyles.borderColor, padding: 0 }]}>
                <TouchableOpacity style={styles.listItem} onPress={() => navigation.navigate('VideoLibrary')}>
                    <View style={[styles.iconBox, { backgroundColor: '#FEE2E2' }]}>
                        <Ionicons name="logo-youtube" size={20} color="#EF4444" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.listTitle, { color: themeStyles.text }]}>Video Library</Text>
                        <Text style={{ color: themeStyles.subtext, fontSize: 12 }}>External resources</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={24} color={themeStyles.subtext} />
                </TouchableOpacity>
                <View style={[styles.divider, { backgroundColor: themeStyles.borderColor }]} />
                <TouchableOpacity style={styles.listItem} onPress={() => navigation.navigate('StudentOnlineAssignments')}>
                    <View style={[styles.iconBox, { backgroundColor: '#DCFCE7' }]}>
                        <Ionicons name="desktop-outline" size={20} color="#10B981" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.listTitle, { color: themeStyles.text }]}>E-Learning Modules</Text>
                        <Text style={{ color: themeStyles.subtext, fontSize: 12 }}>Interactive content</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={24} color={themeStyles.subtext} />
                </TouchableOpacity>
            </View>

            {/* Assignments */}
            {classroomContent.some(i => i.type === 'quiz') && (
                <>
                    <Text style={[styles.sectionTitle, { color: themeStyles.subtext, marginTop: 24 }]}>ASSIGNMENTS</Text>
                    <View style={[styles.card, { backgroundColor: themeStyles.cardBg, borderColor: themeStyles.borderColor, padding: 0 }]}>
                        {classroomContent.filter(i => i.type === 'quiz').map((item, idx, arr) => (
                            <React.Fragment key={item.id}>
                                <TouchableOpacity style={styles.listItem} onPress={() => handleItemPress(item)}>
                                    <View style={[styles.iconBox, { backgroundColor: '#EEF2FF' }]}>
                                        <MaterialCommunityIcons name="clipboard-text" size={20} color="#4F46E5" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.listTitle, { color: themeStyles.text }]}>{item.title}</Text>
                                        <Text style={{ color: themeStyles.subtext, fontSize: 12 }}>Due {new Date(item.date).toLocaleDateString()}</Text>
                                    </View>
                                    {item.status === 'completed' && <MaterialCommunityIcons name="check-circle" size={20} color="#10B981" />}
                                </TouchableOpacity>
                                {idx < arr.length - 1 && <View style={[styles.divider, { backgroundColor: themeStyles.borderColor }]} />}
                            </React.Fragment>
                        ))}
                    </View>
                </>
            )}
        </ScrollView>
    );

    const renderPeopleTab = () => (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <Text style={[styles.sectionTitle, { color: '#4F46E5', marginBottom: 8 }]}>TEACHERS</Text>
            <View style={[styles.card, { backgroundColor: themeStyles.cardBg, borderColor: themeStyles.borderColor }]}>
                {meta.teachers.map((t, i) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <Image source={{ uri: t.avatar }} style={styles.avatarMedium} />
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.listTitle, { color: themeStyles.text }]}>{t.name}</Text>
                            <Text style={{ color: themeStyles.subtext, fontSize: 12 }}>{t.subject}</Text>
                        </View>
                        <TouchableOpacity>
                            <MaterialCommunityIcons name="email-outline" size={24} color={themeStyles.subtext} />
                        </TouchableOpacity>
                    </View>
                ))}
            </View>

            <Text style={[styles.sectionTitle, { color: '#4F46E5', marginTop: 24, marginBottom: 8 }]}>CLASSMATES</Text>
            <View style={[styles.card, { backgroundColor: themeStyles.cardBg, borderColor: themeStyles.borderColor }]}>
                {/* Mock */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={[styles.avatarMedium, { backgroundColor: '#F472B6', justifyContent: 'center', alignItems: 'center' }]}>
                        <Text style={{ color: '#fff', fontWeight: 'bold' }}>JD</Text>
                    </View>
                    <Text style={[styles.listTitle, { color: themeStyles.text }]}>John Doe</Text>
                </View>
            </View>
        </ScrollView>
    );

    return (
        <ScreenBackground style={styles.container}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />

            {/* Full Width Header Container */}
            <LinearGradient
                colors={isDark ? ['#0A1628', '#1E293B'] : ['#6366F1', '#8B5CF6']}
                style={[styles.header, { paddingTop: insets.top + 16 }]}
            >
                <View style={styles.centerContainer}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle} numberOfLines={1}>{meta.className}</Text>
                        <TouchableOpacity style={styles.iconBtn}>
                            <MaterialCommunityIcons name="dots-horizontal" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>
                    {renderTabs()}
                </View>
            </LinearGradient>

            {/* Centered Content Container */}
            <View style={styles.centerContainer}>
                <View style={styles.content}>
                    {activeTab === 'stream' && renderStreamTab()}
                    {activeTab === 'meets' && renderMeetsTab()}
                    {activeTab === 'classwork' && renderClassworkTab()}
                    {activeTab === 'people' && renderPeopleTab()}
                </View>
            </View>

            {/* Chapter Viewer Modal */}
            <Modal visible={!!selectedChapter} animationType="fade" transparent={true} onRequestClose={() => setSelectedChapter(null)}>
                <Pressable style={styles.modalOverlay} onPress={() => setSelectedChapter(null)}>
                    <Pressable style={[styles.modalCard, { backgroundColor: themeStyles.cardBg }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <Text style={[styles.modalTitle, { color: themeStyles.text }]}>{selectedChapter?.title}</Text>
                            <TouchableOpacity onPress={() => setSelectedChapter(null)}>
                                <MaterialCommunityIcons name="close" size={24} color={themeStyles.subtext} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView>
                            <Text style={{ color: themeStyles.text, lineHeight: 24 }}>{selectedChapter?.fullContent || selectedChapter?.description}</Text>
                        </ScrollView>
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

    card: { borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, flexDirection: 'row', alignItems: 'center' },
    avatarSmall: { width: 32, height: 32, borderRadius: 16 },

    feedTitle: { fontSize: 14, lineHeight: 20 },
    feedDate: { fontSize: 12, marginTop: 4 },
    iconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },

    // Live
    liveHeader: { flex: 1 },
    liveBadge: { backgroundColor: '#EF4444', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginBottom: 8 },
    liveBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
    liveTopic: { fontSize: 16, fontWeight: '700' },
    joinBtnLarge: { backgroundColor: '#EF4444', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
    joinBtnTextLarge: { color: '#fff', fontWeight: '800', fontSize: 12 },

    emptyText: { textAlign: 'center', marginTop: 40 },

    // Classwork
    sectionTitle: { fontSize: 12, fontWeight: '700', marginBottom: 12, letterSpacing: 1 },
    listItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 16 },
    iconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    listTitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
    divider: { height: 1, marginLeft: 68 },

    // People
    avatarMedium: { width: 48, height: 48, borderRadius: 24 },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
    modalCard: { borderRadius: 24, padding: 24, maxHeight: '80%', width: '100%', maxWidth: 600, alignSelf: 'center' },
    modalTitle: { fontSize: 20, fontWeight: '700', flex: 1 },
});

export default ClassroomScreen;
