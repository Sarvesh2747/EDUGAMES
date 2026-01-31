import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, Alert, Platform } from 'react-native';
import { Text, TextInput, useTheme, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';
import { useResponsive } from '../hooks/useResponsive';
import { spacing, gradients, colors } from '../theme';
import CustomButton from '../components/ui/CustomButton';
import LanguageSwitcher from '../components/LanguageSwitcher';

import { AVATAR_OPTIONS } from '../data/avatars';

const ProfileScreen = ({ navigation }: any) => {
    const theme = useTheme();
    const { isDark } = useAppTheme();
    const insets = useSafeAreaInsets();
    const { user, logout, updateUser, xp, streak, level } = useAuth();
    const { containerStyle } = useResponsive();

    const styles = createStyles(isDark);

    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [selectedClass, setSelectedClass] = useState(user?.selectedClass || null);
    const [selectedAvatar, setSelectedAvatar] = useState(parseInt(user?.avatar || '2'));
    const [themeColor, setThemeColor] = useState(user?.themeColor || theme.colors.primary);
    const [city, setCity] = useState(user?.city || '');
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showAvatarPicker, setShowAvatarPicker] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const currentAvatar = AVATAR_OPTIONS.find(a => a.id === selectedAvatar) || AVATAR_OPTIONS[0];

    const handleSave = async () => {
        setLoading(true);
        try {
            await updateUser({
                name,
                email,
                selectedClass,
                avatar: selectedAvatar.toString(),
                themeColor,
                city,
            });
            setIsEditing(false);
            Alert.alert('Success', 'Profile updated successfully!');
        } catch (error) {
            Alert.alert('Error', 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        setShowLogoutConfirm(true);
    };

    const confirmLogout = async () => {
        setShowLogoutConfirm(false);
        await logout();
    };

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={[styles.content, containerStyle, { flexGrow: 1, flex: 0 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <LinearGradient
                    colors={gradients.primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.headerBackground, { paddingTop: insets.top + spacing.md }]}
                >
                    {/* Decorative circles */}
                    <View style={[styles.decorativeCircle, { top: -70, right: -50, width: 200, height: 200 }]} />
                    <View style={[styles.decorativeCircle, { bottom: -60, left: -40, width: 170, height: 170 }]} />

                    <View style={styles.headerContent}>
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            style={styles.backButton}
                            activeOpacity={0.7}
                        >
                            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text variant="headlineMedium" style={styles.headerTitle}>Profile</Text>
                        <LanguageSwitcher />
                    </View>

                    {/* Avatar Section in Header */}
                    <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.headerAvatarSection}>
                        <TouchableOpacity
                            onPress={() => isEditing && setShowAvatarPicker(true)}
                            disabled={!isEditing}
                            style={styles.avatarContainer}
                        >
                            <LinearGradient
                                colors={currentAvatar.gradient}
                                style={styles.avatarGradient}
                            >
                                <Image
                                    source={currentAvatar.source}
                                    style={styles.avatarImage}
                                    resizeMode="cover"
                                />
                            </LinearGradient>
                            {isEditing && (
                                <View style={styles.editAvatarBadge}>
                                    <MaterialCommunityIcons name="pencil" size={20} color="#fff" />
                                </View>
                            )}
                        </TouchableOpacity>
                        <Text variant="headlineSmall" style={styles.userName}>{user?.name}</Text>
                        <Text variant="bodyMedium" style={styles.userEmail}>{user?.email}</Text>
                    </Animated.View>
                </LinearGradient>

                <View style={[containerStyle, styles.contentContainer]}>
                    {/* Stats Cards */}
                    <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.statsContainer}>
                        <LinearGradient
                            colors={['#FCD34D', '#F59E0B']}
                            style={styles.statCard}
                        >
                            <MaterialCommunityIcons name="crown" size={32} color="#fff" />
                            <Text variant="headlineMedium" style={styles.statValue}>{level}</Text>
                            <Text variant="bodySmall" style={styles.statLabel}>Level</Text>
                        </LinearGradient>

                        <LinearGradient
                            colors={['#FF6B6B', '#FF8E53']}
                            style={styles.statCard}
                        >
                            <MaterialCommunityIcons name="fire" size={32} color="#fff" />
                            <Text variant="headlineMedium" style={styles.statValue}>{streak}</Text>
                            <Text variant="bodySmall" style={styles.statLabel}>Day Streak</Text>
                        </LinearGradient>

                        <LinearGradient
                            colors={['#2563EB', '#06B6D4']}
                            style={styles.statCard}
                        >
                            <MaterialCommunityIcons name="star" size={32} color="#fff" />
                            <Text variant="headlineMedium" style={styles.statValue}>{xp}</Text>
                            <Text variant="bodySmall" style={styles.statLabel}>Total XP</Text>
                        </LinearGradient>
                    </Animated.View>

                    {/* Analytics Button */}
                    <Animated.View entering={FadeInUp.delay(250).duration(600)} style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.lg }}>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('CourseProgress', { userId: user?._id, subject: 'Science', classLevel: user?.selectedClass || '6' })}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#7C3AED', '#6D28D9']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: spacing.lg,
                                    borderRadius: 20,
                                    shadowColor: '#7C3AED',
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.3,
                                    shadowRadius: 8,
                                    elevation: 6
                                }}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                    <View style={{
                                        width: 48, height: 48, borderRadius: 24,
                                        backgroundColor: 'rgba(255,255,255,0.2)',
                                        justifyContent: 'center', alignItems: 'center'
                                    }}>
                                        <MaterialCommunityIcons name="chart-timeline-variant" size={24} color="#fff" />
                                    </View>
                                    <View>
                                        <Text variant="titleMedium" style={{ color: '#fff', fontWeight: 'bold' }}>Learning Analytics</Text>
                                        <Text variant="bodySmall" style={{ color: 'rgba(255,255,255,0.8)' }}>View your mastery progress</Text>
                                    </View>
                                </View>
                                <MaterialCommunityIcons name="chevron-right" size={24} color="#fff" />
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>

                    {/* Profile Form Card */}
                    <Animated.View entering={FadeInUp.delay(300).duration(600)} style={styles.profileCardContainer}>
                        <Surface style={styles.profileCard} elevation={2}>
                            <View style={styles.formContainer}>
                                <TextInput
                                    label="Full Name"
                                    value={name}
                                    onChangeText={setName}
                                    mode="outlined"
                                    disabled={!isEditing}
                                    style={styles.input}
                                    textColor={isDark ? '#F1F5F9' : '#1A1A1A'}
                                    outlineColor={isDark ? '#475569' : '#E2E8F0'}
                                    activeOutlineColor={isDark ? '#60A5FA' : '#2563EB'}
                                />
                                <TextInput
                                    label="Email"
                                    value={email}
                                    onChangeText={setEmail}
                                    mode="outlined"
                                    disabled={!isEditing}
                                    keyboardType="email-address"
                                    style={styles.input}
                                    textColor={isDark ? '#F1F5F9' : '#1A1A1A'}
                                    outlineColor={isDark ? '#475569' : '#E2E8F0'}
                                    activeOutlineColor={isDark ? '#60A5FA' : '#2563EB'}
                                />
                                <TextInput
                                    label="City"
                                    value={city}
                                    onChangeText={setCity}
                                    mode="outlined"
                                    disabled={!isEditing}
                                    placeholder="Enter your city"
                                    style={styles.input}
                                    textColor={isDark ? '#F1F5F9' : '#1A1A1A'}
                                    outlineColor={isDark ? '#475569' : '#E2E8F0'}
                                    activeOutlineColor={isDark ? '#60A5FA' : '#2563EB'}
                                    left={<TextInput.Icon icon="map-marker" />}
                                />

                                {/* Class Selection */}
                                <View style={styles.classSelectionContainer}>
                                    <Text variant="titleMedium" style={styles.sectionLabel}>
                                        Select Your Class (6-12)
                                    </Text>
                                    <View style={styles.classButtonsContainer}>
                                        {[6, 7, 8, 9, 10, 11, 12].map((classNum) => (
                                            <TouchableOpacity
                                                key={classNum}
                                                onPress={() => isEditing && setSelectedClass(classNum)}
                                                disabled={!isEditing}
                                                style={[
                                                    styles.classButton,
                                                    selectedClass === classNum && styles.classButtonSelected,
                                                    !isEditing && styles.classButtonDisabled
                                                ]}
                                                activeOpacity={0.7}
                                            >
                                                <Text style={[
                                                    styles.classButtonText,
                                                    selectedClass === classNum && styles.classButtonTextSelected
                                                ]}>
                                                    {classNum}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                    {selectedClass && (
                                        <Text variant="bodySmall" style={styles.selectedClassText}>
                                            Selected: Class {selectedClass}
                                        </Text>
                                    )}
                                </View>
                            </View>

                            {/* Action Buttons */}
                            <View style={styles.buttonContainer}>
                                {!isEditing ? (
                                    <CustomButton
                                        variant="primary"
                                        icon="pencil"
                                        onPress={() => setIsEditing(true)}
                                    >
                                        Edit Profile
                                    </CustomButton>
                                ) : (
                                    <>
                                        <CustomButton
                                            variant="primary"
                                            icon="check"
                                            onPress={handleSave}
                                            loading={loading}
                                        >
                                            Save Changes
                                        </CustomButton>
                                        <CustomButton
                                            variant="outlined"
                                            icon="close"
                                            onPress={() => {
                                                setIsEditing(false);
                                                setName(user?.name || '');
                                                setEmail(user?.email || '');
                                                setSelectedClass(user?.selectedClass || null);
                                            }}
                                        >
                                            Cancel
                                        </CustomButton>
                                    </>
                                )}
                            </View>
                        </Surface>
                    </Animated.View>

                    {/* Logout Button */}
                    <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.logoutContainer}>
                        <TouchableOpacity
                            onPress={handleLogout}
                            style={styles.logoutButton}
                            activeOpacity={0.7}
                        >
                            <MaterialCommunityIcons
                                name="logout"
                                size={20}
                                color={isDark ? '#F87171' : '#DC2626'}
                            />
                            <Text style={styles.logoutText}>Logout</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>

                {/* Avatar Picker Modal */}
                <Modal
                    visible={showAvatarPicker}
                    animationType="fade"
                    transparent
                    onRequestClose={() => setShowAvatarPicker(false)}
                >
                    <View style={styles.modalOverlay}>
                        <Animated.View entering={FadeIn.duration(300)} style={styles.modalContent}>
                            <Surface style={styles.avatarPickerSurface} elevation={5}>
                                <View style={styles.modalHeader}>
                                    <Text variant="headlineSmall" style={styles.modalTitle}>Choose Avatar</Text>
                                    <TouchableOpacity onPress={() => setShowAvatarPicker(false)}>
                                        <MaterialCommunityIcons name="close" size={24} color={isDark ? '#CBD5E1' : '#666'} />
                                    </TouchableOpacity>
                                </View>

                                <ScrollView contentContainerStyle={styles.avatarGrid}>
                                    {AVATAR_OPTIONS.map((avatar) => (
                                        <TouchableOpacity
                                            key={avatar.id}
                                            onPress={() => {
                                                setSelectedAvatar(avatar.id);
                                                setShowAvatarPicker(false);
                                            }}
                                            style={styles.avatarOption}
                                        >
                                            <LinearGradient
                                                colors={avatar.gradient}
                                                style={[
                                                    styles.avatarOptionGradient,
                                                    selectedAvatar === avatar.id && styles.avatarOptionSelected
                                                ]}
                                            >
                                                <Image
                                                    source={avatar.source}
                                                    style={styles.avatarOptionImage}
                                                    resizeMode="cover"
                                                />
                                            </LinearGradient>
                                            {selectedAvatar === avatar.id && (
                                                <View style={styles.selectedBadge}>
                                                    <MaterialCommunityIcons name="check-circle" size={24} color="#4CAF50" />
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </Surface>
                        </Animated.View>
                    </View>
                </Modal>

                {/* Logout Confirmation Modal */}
                <Modal
                    visible={showLogoutConfirm}
                    animationType="fade"
                    transparent
                    onRequestClose={() => setShowLogoutConfirm(false)}
                >
                    <View style={styles.modalOverlay}>
                        <Animated.View entering={FadeIn.duration(300)} style={styles.modalContent}>
                            <Surface style={styles.logoutConfirmSurface} elevation={5}>
                                <View style={styles.logoutConfirmHeader}>
                                    <MaterialCommunityIcons
                                        name="logout"
                                        size={48}
                                        color={isDark ? '#F87171' : '#DC2626'}
                                    />
                                </View>
                                <Text variant="headlineSmall" style={styles.logoutConfirmTitle}>
                                    Logout
                                </Text>
                                <Text variant="bodyMedium" style={styles.logoutConfirmMessage}>
                                    Are you sure you want to logout?
                                </Text>
                                <View style={styles.logoutConfirmButtons}>
                                    <TouchableOpacity
                                        onPress={() => setShowLogoutConfirm(false)}
                                        style={[styles.logoutConfirmButton, styles.cancelButton]}
                                    >
                                        <Text style={styles.cancelButtonText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={confirmLogout}
                                        style={[styles.logoutConfirmButton, styles.confirmButton]}
                                    >
                                        <Text style={styles.confirmButtonText}>Logout</Text>
                                    </TouchableOpacity>
                                </View>
                            </Surface>
                        </Animated.View>
                    </View>
                </Modal>
            </ScrollView>
        </View>
    );
};

const createStyles = (isDark: boolean) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
    },
    content: {
        paddingBottom: 100,
    },
    headerBackground: {
        paddingBottom: spacing.xxl + spacing.lg,
        borderBottomLeftRadius: 36,
        borderBottomRightRadius: 36,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.35,
        shadowRadius: 24,
        elevation: 12,
        overflow: 'hidden',
    },
    decorativeCircle: {
        position: 'absolute',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 1000,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        marginBottom: spacing.xl,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    headerTitle: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 24,
    },
    headerAvatarSection: {
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    avatarContainer: {
        marginBottom: spacing.md,
    },
    avatarGradient: {
        width: 110,
        height: 110,
        borderRadius: 55,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 10,
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    editAvatarBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#667EEA',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#fff',
    },
    userName: {
        color: '#fff',
        fontWeight: '800',
        marginBottom: spacing.xs,
    },
    userEmail: {
        color: 'rgba(255,255,255,0.8)',
    },
    contentContainer: {
        marginTop: -spacing.xxl,
    },
    statsContainer: {
        flexDirection: 'row',
        gap: spacing.md,
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.xl,
    },
    statCard: {
        flex: 1,
        padding: spacing.lg,
        borderRadius: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
    },
    statValue: {
        color: '#fff',
        fontWeight: '800',
        marginTop: spacing.xs,
    },
    statLabel: {
        color: 'rgba(255,255,255,0.9)',
        marginTop: spacing.xs,
        fontWeight: '600',
    },
    profileCardContainer: {
        paddingHorizontal: spacing.lg,
    },
    profileCard: {
        borderRadius: 24,
        padding: spacing.xl,
        backgroundColor: isDark ? '#1E293B' : '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    formContainer: {
        gap: spacing.lg,
        marginBottom: spacing.xl,
    },
    classSelectionContainer: {
        paddingTop: spacing.md,
    },
    sectionLabel: {
        marginBottom: spacing.md,
        fontWeight: '600',
        color: isDark ? '#F1F5F9' : '#1A1A1A',
    },
    classButtonsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
        marginBottom: spacing.sm,
    },
    classButton: {
        width: 50,
        height: 50,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: isDark ? '#475569' : '#E2E8F0',
        backgroundColor: isDark ? '#0F172A' : '#F8F9FA',
        alignItems: 'center',
        justifyContent: 'center',
    },
    classButtonSelected: {
        borderColor: '#2563EB',
        backgroundColor: isDark ? 'rgba(37, 99, 235, 0.2)' : 'rgba(37, 99, 235, 0.1)',
    },
    classButtonDisabled: {
        opacity: 0.6,
    },
    classButtonText: {
        fontSize: 18,
        fontWeight: '700',
        color: isDark ? '#CBD5E1' : '#475569',
    },
    classButtonTextSelected: {
        color: '#2563EB',
    },
    selectedClassText: {
        color: isDark ? '#60A5FA' : '#2563EB',
        fontWeight: '600',
        marginTop: spacing.xs,
    },
    input: {
        backgroundColor: isDark ? '#0F172A' : '#F8F9FA',
    },
    buttonContainer: {
        gap: spacing.md,
    },
    logoutContainer: {
        paddingHorizontal: spacing.lg,
        marginTop: spacing.xl,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: isDark ? '#F87171' : '#DC2626',
        backgroundColor: isDark ? 'rgba(248, 113, 113, 0.1)' : 'rgba(220, 38, 38, 0.05)',
        gap: spacing.sm,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
        color: isDark ? '#F87171' : '#DC2626',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    modalContent: {
        width: '100%',
        maxWidth: 500,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarPickerSurface: {
        borderRadius: 24,
        padding: spacing.xl,
        backgroundColor: isDark ? '#1E293B' : '#fff',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    modalTitle: {
        fontWeight: 'bold',
        color: isDark ? '#F1F5F9' : '#333',
    },
    avatarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.md,
        justifyContent: 'center',
    },
    avatarOption: {
        position: 'relative',
    },
    avatarOptionGradient: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: 'transparent',
        overflow: 'hidden',
    },
    avatarOptionSelected: {
        borderColor: '#4CAF50',
        borderWidth: 4,
    },
    avatarOptionImage: {
        width: '100%',
        height: '100%',
    },
    selectedBadge: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: '#fff',
        borderRadius: 12,
    },
    logoutConfirmSurface: {
        borderRadius: 24,
        padding: spacing.xl,
        backgroundColor: isDark ? '#1E293B' : '#fff',
        alignItems: 'center',
        maxWidth: 400,
        width: '100%',
    },
    logoutConfirmHeader: {
        marginBottom: spacing.md,
    },
    logoutConfirmTitle: {
        fontWeight: 'bold',
        color: isDark ? '#F1F5F9' : '#333',
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    logoutConfirmMessage: {
        color: isDark ? '#CBD5E1' : '#666',
        marginBottom: spacing.xl,
        textAlign: 'center',
    },
    logoutConfirmButtons: {
        flexDirection: 'row',
        gap: spacing.md,
        width: '100%',
    },
    logoutConfirmButton: {
        flex: 1,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        backgroundColor: isDark ? '#334155' : '#E2E8F0',
        borderWidth: 1,
        borderColor: isDark ? '#475569' : '#CBD5E1',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: isDark ? '#F1F5F9' : '#475569',
    },
    confirmButton: {
        backgroundColor: isDark ? '#DC2626' : '#DC2626',
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});

export default ProfileScreen;
