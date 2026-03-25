import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Modal, Pressable, Alert, Platform, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TextInput, Button, Surface } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenBackground from '../components/ScreenBackground';
import { theme, spacing, borderRadius, shadows } from '../theme';
import { fetchClassroomsList, ClassroomListItem } from '../services/studentService';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAppTheme } from '../context/ThemeContext';

const ClassroomListScreen = () => {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const { isDark } = useAppTheme();
    const [loading, setLoading] = useState(true);
    const [classrooms, setClassrooms] = useState<ClassroomListItem[]>([]);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [classroomCode, setClassroomCode] = useState('');
    const [joining, setJoining] = useState(false);

    useEffect(() => {
        loadClassrooms();
    }, []);

    const loadClassrooms = async () => {
        try {
            const data = await fetchClassroomsList();
            setClassrooms(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleJoinClassroom = async () => {
        if (!classroomCode.trim()) {
            Alert.alert('Error', 'Please enter a classroom code');
            return;
        }

        setJoining(true);
        try {
            // Placeholder for join logic
            setTimeout(() => {
                Alert.alert('Success', 'Joined classroom successfully!');
                setClassroomCode('');
                setShowJoinModal(false);
                setJoining(false);
            }, 1000);
            // await joinClassroom(classroomCode.trim());
            // await loadClassrooms();
        } catch (error: any) {
            setJoining(false);
            Alert.alert('Error', error?.response?.data?.message || 'Failed to join classroom');
        }
    };

    const handleClassroomPress = (params: any) => {
        navigation.navigate('Classroom', params);
    };

    const renderClassCard = (item: ClassroomListItem, index: number) => {
        return (
            <Animated.View
                key={item.id}
                entering={FadeInDown.delay(index * 100)}
                style={styles.cardContainer}
            >
                <View
                    style={[
                        styles.card,
                        {
                            backgroundColor: isDark ? '#1E293B' : '#fff',
                            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                        }
                    ]}
                >
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => handleClassroomPress({ subject: item.subject })}
                        style={{ flex: 1 }}
                    >
                        {/* Header Banner with Gradient */}
                        <LinearGradient
                            colors={(item.gradient || ['#6366F1', '#4F46E5']) as any}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.cardHeader}
                        >
                            <View style={styles.headerContent}>
                                <View style={styles.titleRow}>
                                    <Text style={styles.cardTitle} numberOfLines={1}>{item.subject}</Text>
                                    <TouchableOpacity>
                                        <MaterialCommunityIcons name="dots-horizontal" size={24} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                                <Text style={styles.cardSubtitle} numberOfLines={1}>{item.className}</Text>
                            </View>
                            <Image source={{ uri: item.teacherAvatar }} style={styles.teacherAvatar} />
                        </LinearGradient>

                        {/* Body */}
                        <View style={styles.cardBody}>
                            <View style={styles.teacherInfoRow}>
                                <MaterialCommunityIcons name="account-tie-outline" size={18} color={isDark ? '#94A3B8' : '#64748B'} />
                                <Text style={[styles.teacherName, { color: isDark ? '#E2E8F0' : '#334155' }]} numberOfLines={1}>
                                    {item.teacher || 'Class Teacher'}
                                </Text>
                            </View>
                        </View>
                    </TouchableOpacity>

                    {/* Footer */}
                    <View style={[styles.cardFooter, { borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : '#F1F5F9' }]}>
                        <View style={styles.statsRow}>
                            {/* Placeholder stats or icons */}
                        </View>
                        <View style={styles.actionButtons}>
                            <TouchableOpacity
                                style={styles.iconButton}
                                onPress={() => handleClassroomPress({ subject: item.subject, initialTab: 'classwork' })}
                            >
                                <MaterialCommunityIcons name="clipboard-text-outline" size={22} color={isDark ? '#94A3B8' : '#64748B'} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.iconButton}
                                onPress={() => handleClassroomPress({ subject: item.subject, initialTab: 'classwork' })}
                            >
                                <MaterialCommunityIcons name="folder-outline" size={22} color={isDark ? '#94A3B8' : '#64748B'} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Animated.View>
        );
    };

    const themeStyles = {
        text: isDark ? '#F8FAFC' : '#1E293B',
        subtext: isDark ? '#94A3B8' : '#64748B',
        bg: isDark ? '#0F172A' : '#F8FAFC',
        modalBg: isDark ? '#1E293B' : '#fff',
        inputBg: isDark ? '#334155' : '#F1F5F9',
        border: isDark ? '#334155' : '#E2E8F0',
    };

    return (
        <ScreenBackground style={styles.container}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />

            {/* Premium Header */}
            <LinearGradient
                colors={isDark ? ['#0A1628', '#1E293B'] : ['#6366F1', '#8B5CF6', '#A855F7']}
                style={[styles.headerBackground, { paddingTop: insets.top + 16 }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.navBar}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navButton}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.navTitle}>My Classrooms</Text>
                    <TouchableOpacity onPress={() => setShowJoinModal(true)} style={styles.addClassBtn}>
                        <MaterialCommunityIcons name="plus" size={24} color={isDark ? '#fff' : '#6366F1'} />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {/* Content */}
            <ScrollView
                contentContainerStyle={[styles.listContent, { paddingTop: 24 }]} // Overlap effect
                showsVerticalScrollIndicator={false}
            >
                {loading ? (
                    <ActivityIndicator size="large" color="#6366F1" style={{ marginTop: 40 }} />
                ) : classrooms.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Image
                            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2997/2997255.png' }}
                            style={{ width: 120, height: 120, opacity: 0.5, marginBottom: 16, tintColor: isDark ? '#fff' : undefined }}
                        />
                        <Text style={[styles.emptyText, { color: themeStyles.subtext }]}>No classrooms found</Text>
                        <TouchableOpacity onPress={() => setShowJoinModal(true)}>
                            <Text style={styles.linkText}>Join a class</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.grid}>
                        {classrooms.map((item, index) => renderClassCard(item, index))}
                    </View>
                )}
                <View style={{ height: 80 }} />
            </ScrollView>

            {/* Join Classroom Modal */}
            <Modal visible={showJoinModal} transparent animationType="fade" onRequestClose={() => setShowJoinModal(false)}>
                <Pressable style={styles.modalOverlay} onPress={() => setShowJoinModal(false)}>
                    <Pressable style={[styles.modalContent, { backgroundColor: themeStyles.modalBg }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: themeStyles.text }]}>Join Classroom</Text>
                            <TouchableOpacity onPress={() => setShowJoinModal(false)}>
                                <MaterialCommunityIcons name="close" size={24} color={themeStyles.subtext} />
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.modalDescription, { color: themeStyles.subtext }]}>
                            Enter the class code provided by your teacher.
                        </Text>

                        <TextInput
                            mode="outlined"
                            label="Class Code"
                            value={classroomCode}
                            onChangeText={setClassroomCode}
                            placeholder="e.g. ABC1234"
                            autoCapitalize="characters"
                            style={[styles.input, { backgroundColor: themeStyles.inputBg }]}
                            theme={{ colors: { background: themeStyles.inputBg, onSurface: themeStyles.text, placeholder: themeStyles.subtext, text: themeStyles.text } }}
                            textColor={themeStyles.text}
                        />

                        <View style={styles.modalActions}>
                            <Button mode="text" onPress={() => setShowJoinModal(false)} textColor={themeStyles.subtext}>Cancel</Button>
                            <Button
                                mode="contained"
                                onPress={handleJoinClassroom}
                                loading={joining}
                                disabled={!classroomCode.trim() || joining}
                                buttonColor="#6366F1"
                            >
                                Join
                            </Button>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </ScreenBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerBackground: {
        paddingBottom: 24,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    navBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 10,
    },
    navButton: {
        padding: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
    },
    navTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#fff',
        marginLeft: 16,
        flex: 1,
    },
    addClassBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingHorizontal: 16,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        justifyContent: 'center', // Centered grid
    },
    cardContainer: {
        width: Platform.OS === 'web' ? 'auto' : '100%',
        minWidth: 300,
        maxWidth: Platform.OS === 'web' ? 380 : undefined,
        flexGrow: 1,
        marginBottom: 8,
    },
    card: {
        borderRadius: 20,
        borderWidth: 1,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    cardHeader: {
        height: 100,
        padding: 16,
        position: 'relative',
        justifyContent: 'center',
    },
    headerContent: {
        paddingRight: 60, // Space for avatar
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 4,
        flex: 1,
    },
    cardSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '500',
    },
    teacherAvatar: {
        position: 'absolute',
        right: 16,
        top: 50, // Floating between header and body
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 3,
        borderColor: '#fff',
        zIndex: 10,
    },
    cardBody: {
        paddingTop: 36, // Space for avatar
        paddingHorizontal: 16,
        paddingBottom: 16,
        minHeight: 80,
    },
    teacherInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    teacherName: {
        fontSize: 14,
        fontWeight: '600',
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    iconButton: {
        padding: 8,
        borderRadius: 8,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 80,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
    },
    linkText: {
        color: '#6366F1',
        fontWeight: '600',
        fontSize: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 24,
        padding: 24,
        elevation: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    modalDescription: {
        fontSize: 14,
        marginBottom: 20,
    },
    input: {
        marginBottom: 24,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
    },
});

export default ClassroomListScreen;
