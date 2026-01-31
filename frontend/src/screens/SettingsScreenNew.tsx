import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Alert, Platform, Modal, Linking } from 'react-native';
import { Text, Switch, useTheme, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { spacing } from '../theme';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import CustomButton from '../components/ui/CustomButton';
import { useResponsive } from '../hooks/useResponsive';
import UnifiedHeader from '../components/UnifiedHeader';

const SettingsScreen = ({ navigation }: any) => {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const { containerStyle } = useResponsive();
    const { logout, user } = useAuth();
    const { isDark, toggleTheme } = useAppTheme();

    const styles = createStyles(isDark);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [autoDownload, setAutoDownload] = useState(false);
    const [showAboutModal, setShowAboutModal] = useState(false);
    const [showHelpModal, setShowHelpModal] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);

    const handleLogout = async () => {
        if (Platform.OS === 'web') {
            if (window.confirm('Are you sure you want to logout?')) {
                await logout();
            }
        } else {
            Alert.alert(
                'Logout',
                'Are you sure you want to logout?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Logout',
                        style: 'destructive',
                        onPress: async () => {
                            await logout();
                        }
                    },
                ]
            );
        }
    };

    const SettingItem = ({ icon, title, description, onPress, rightComponent, gradient }: any) => (
        <TouchableOpacity
            onPress={onPress}
            disabled={!onPress}
            activeOpacity={0.7}
            style={styles.settingItem}
        >
            <LinearGradient
                colors={gradient || ['#F5F5F5', '#E0E0E0']}
                style={styles.settingIconContainer}
            >
                <MaterialCommunityIcons name={icon} size={24} color={gradient ? '#fff' : '#666'} />
            </LinearGradient>
            <View style={styles.settingContent}>
                <Text variant="titleMedium" style={styles.settingTitle}>{title}</Text>
                {description && (
                    <Text variant="bodySmall" style={styles.settingDescription}>{description}</Text>
                )}
            </View>
            {rightComponent || (
                <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
            )}
        </TouchableOpacity>
    );

    const InfoModal = ({ visible, onClose, title, icon, iconGradient, children }: any) => (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <Animated.View entering={Platform.OS === 'web' ? undefined : FadeIn.duration(300)} style={styles.modalContent}>
                    <Surface style={styles.modalSurface} elevation={5}>
                        <View style={styles.modalHeader}>
                            <LinearGradient
                                colors={iconGradient}
                                style={styles.modalIconContainer}
                            >
                                <MaterialCommunityIcons name={icon} size={32} color="#fff" />
                            </LinearGradient>
                            <Text variant="headlineSmall" style={styles.modalTitle}>{title}</Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <MaterialCommunityIcons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                            {children}
                        </ScrollView>
                    </Surface>
                </Animated.View>
            </View>
        </Modal>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <UnifiedHeader
                    title="Settings"
                    subtitle="App Preferences"
                    hideStats={true}
                />

                <View style={{ marginTop: -40 }}>

                    {/* Account Section */}
                    <Animated.View entering={Platform.OS === 'web' ? undefined : FadeInDown.delay(100).duration(600)}>
                        <Text variant="titleSmall" style={styles.sectionTitle}>ACCOUNT</Text>
                        <Surface style={styles.section} elevation={2}>
                            <SettingItem
                                icon="account-circle"
                                title="Edit Profile"
                                description="Update your personal information"
                                onPress={() => navigation.navigate('Profile')}
                                gradient={['#667EEA', '#764BA2']}
                            />
                            <View style={styles.divider} />
                            <SettingItem
                                icon="lock-outline"
                                title="Privacy & Security"
                                description="Manage your privacy settings"
                                onPress={() => navigation.navigate('PrivacySecurity')}
                            />
                        </Surface>
                    </Animated.View>

                    {/* Preferences Section */}
                    <Animated.View entering={Platform.OS === 'web' ? undefined : FadeInDown.delay(200).duration(600)}>
                        <Text variant="titleSmall" style={styles.sectionTitle}>PREFERENCES</Text>
                        <Surface style={styles.section} elevation={2}>
                            <SettingItem
                                icon="theme-light-dark"
                                title="Dark Mode"
                                description="Toggle dark theme"
                                gradient={isDark ? ['#4A5568', '#2D3748'] : undefined}
                                rightComponent={
                                    <Switch
                                        value={isDark}
                                        onValueChange={toggleTheme}
                                        color="#667EEA"
                                    />
                                }
                            />
                            <View style={styles.divider} />
                            <SettingItem
                                icon="bell-outline"
                                title="View Notifications"
                                description="See your notifications"
                                gradient={notificationsEnabled ? ['#10B981', '#059669'] : undefined}
                                onPress={() => navigation.navigate('Notifications')}
                                rightComponent={
                                    <Switch
                                        value={notificationsEnabled}
                                        onValueChange={setNotificationsEnabled}
                                        color="#667EEA"
                                    />
                                }
                            />
                            <View style={styles.divider} />
                            <SettingItem
                                icon="volume-high"
                                title="Sound Effects"
                                description="Enable sound effects"
                                gradient={soundEnabled ? ['#F59E0B', '#D97706'] : undefined}
                                rightComponent={
                                    <Switch
                                        value={soundEnabled}
                                        onValueChange={setSoundEnabled}
                                        color="#667EEA"
                                    />
                                }
                            />
                            <View style={styles.divider} />
                            <SettingItem
                                icon="clock-time-eight-outline"
                                title="Digital Wellbeing"
                                description="Track your screen time"
                                onPress={() => navigation.navigate('DigitalWellbeing')}
                                gradient={['#10B981', '#059669']}
                            />
                        </Surface>
                    </Animated.View>

                    {/* Data & Storage Section */}
                    <Animated.View entering={Platform.OS === 'web' ? undefined : FadeInDown.delay(300).duration(600)}>
                        <Text variant="titleSmall" style={styles.sectionTitle}>DATA & STORAGE</Text>
                        <Surface style={styles.section} elevation={2}>
                            <SettingItem
                                icon="cloud-sync-outline"
                                title="Sync Data"
                                description="Download content for offline use"
                                onPress={() => navigation.navigate('Sync')}
                                gradient={['#3B82F6', '#2563EB']}
                            />
                            <View style={styles.divider} />
                            <SettingItem
                                icon="download-outline"
                                title="Auto Download"
                                description="Automatically download new content"
                                gradient={autoDownload ? ['#8B5CF6', '#7C3AED'] : undefined}
                                rightComponent={
                                    <Switch
                                        value={autoDownload}
                                        onValueChange={setAutoDownload}
                                        color="#667EEA"
                                    />
                                }
                            />
                            <View style={styles.divider} />
                            <SettingItem
                                icon="trash-can-outline"
                                title="Clear Cache"
                                description="Free up storage space"
                                onPress={() => Alert.alert('Clear Cache', 'Are you sure you want to clear the cache?')}
                            />
                        </Surface>
                    </Animated.View>

                    {/* About Section */}
                    <Animated.View entering={Platform.OS === 'web' ? undefined : FadeInDown.delay(400).duration(600)}>
                        <Text variant="titleSmall" style={styles.sectionTitle}>ABOUT</Text>
                        <Surface style={styles.section} elevation={2}>
                            <SettingItem
                                icon="information-outline"
                                title="About App"
                                description="Version 1.0.0"
                                onPress={() => setShowAboutModal(true)}
                            />
                            <View style={styles.divider} />
                            <SettingItem
                                icon="help-circle-outline"
                                title="Help & Support"
                                description="Get help and contact support"
                                onPress={() => setShowHelpModal(true)}
                            />
                            <View style={styles.divider} />
                            <SettingItem
                                icon="file-document-outline"
                                title="Terms & Privacy"
                                description="Read our terms and privacy policy"
                                onPress={() => setShowTermsModal(true)}
                            />
                        </Surface>
                    </Animated.View>

                    {/* Logout Button */}
                    <Animated.View entering={Platform.OS === 'web' ? undefined : FadeInDown.delay(500).duration(600)} style={styles.logoutContainer}>
                        <CustomButton
                            variant="outlined"
                            icon="logout"
                            onPress={handleLogout}
                            style={styles.logoutButton}
                        >
                            Logout
                        </CustomButton>
                    </Animated.View>

                    {/* App Info */}
                    <View style={styles.appInfo}>
                        <Text variant="bodySmall" style={styles.appInfoText}>
                            CoreTechLabs v1.0.0
                        </Text>
                        <Text variant="bodySmall" style={styles.appInfoText}>
                            Made with ❤️ for rural students
                        </Text>
                    </View>
                </View>
            </ScrollView>

            {/* About App Modal */}
            <InfoModal
                visible={showAboutModal}
                onClose={() => setShowAboutModal(false)}
                title="About App"
                icon="information-outline"
                iconGradient={['#667EEA', '#764BA2']}
            >
                <View style={styles.modalSection}>
                    <Text variant="titleLarge" style={styles.appName}>CoreTechLabs</Text>
                    <Text variant="bodyMedium" style={styles.versionText}>Version 1.0.0</Text>
                </View>

                <View style={styles.modalSection}>
                    <Text variant="titleMedium" style={styles.sectionHeading}>About</Text>
                    <Text variant="bodyMedium" style={styles.modalText}>
                        A modern, interactive learning platform designed specifically for rural students in India.
                        Our mission is to make quality education accessible to everyone, everywhere.
                    </Text>
                </View>

                <View style={styles.modalSection}>
                    <Text variant="titleMedium" style={styles.sectionHeading}>Features</Text>
                    <View style={styles.featureItem}>
                        <MaterialCommunityIcons name="check-circle" size={20} color="#10B981" />
                        <Text variant="bodyMedium" style={styles.featureText}>Interactive lessons for Classes 6-12</Text>
                    </View>
                    <View style={styles.featureItem}>
                        <MaterialCommunityIcons name="check-circle" size={20} color="#10B981" />
                        <Text variant="bodyMedium" style={styles.featureText}>Engaging educational games</Text>
                    </View>
                    <View style={styles.featureItem}>
                        <MaterialCommunityIcons name="check-circle" size={20} color="#10B981" />
                        <Text variant="bodyMedium" style={styles.featureText}>3D simulations and models</Text>
                    </View>
                    <View style={styles.featureItem}>
                        <MaterialCommunityIcons name="check-circle" size={20} color="#10B981" />
                        <Text variant="bodyMedium" style={styles.featureText}>Offline learning support</Text>
                    </View>
                    <View style={styles.featureItem}>
                        <MaterialCommunityIcons name="check-circle" size={20} color="#10B981" />
                        <Text variant="bodyMedium" style={styles.featureText}>Progress tracking & rewards</Text>
                    </View>
                </View>

                <View style={styles.modalSection}>
                    <Text variant="bodySmall" style={styles.copyrightText}>
                        © 2026 CoreTechLabs. All rights reserved.
                    </Text>
                </View>
            </InfoModal>

            {/* Help & Support Modal */}
            <InfoModal
                visible={showHelpModal}
                onClose={() => setShowHelpModal(false)}
                title="Help & Support"
                icon="help-circle-outline"
                iconGradient={['#10B981', '#059669']}
            >
                <View style={styles.modalSection}>
                    <Text variant="titleMedium" style={styles.sectionHeading}>Get Help</Text>
                    <Text variant="bodyMedium" style={styles.modalText}>
                        We're here to help! If you have any questions or need assistance, please reach out to us.
                    </Text>
                </View>

                <View style={styles.modalSection}>
                    <Text variant="titleMedium" style={styles.sectionHeading}>Contact Us</Text>
                    <TouchableOpacity
                        style={styles.contactItem}
                        onPress={() => Linking.openURL('mailto:divyesh.ravane_comp23@pccoer.in')}
                    >
                        <MaterialCommunityIcons name="email" size={24} color="#667EEA" />
                        <Text variant="bodyMedium" style={styles.contactText}>divyesh.ravane_comp23@pccoer.in</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.contactItem, { marginTop: 8 }]}
                        onPress={() => Linking.openURL('tel:8999867349')}
                    >
                        <MaterialCommunityIcons name="phone" size={24} color="#667EEA" />
                        <Text variant="bodyMedium" style={styles.contactText}>+91 89998 67349</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.modalSection}>
                    <Text variant="titleMedium" style={styles.sectionHeading}>FAQ</Text>
                    <Text variant="bodyMedium" style={styles.modalText}>
                        Visit our FAQ section for answers to common questions.
                    </Text>
                </View>
            </InfoModal>

            {/* Terms & Privacy Modal */}
            <InfoModal
                visible={showTermsModal}
                onClose={() => setShowTermsModal(false)}
                title="Terms & Privacy"
                icon="file-document-outline"
                iconGradient={['#F59E0B', '#D97706']}
            >
                <View style={styles.modalSection}>
                    <Text variant="titleMedium" style={styles.sectionHeading}>Terms of Service</Text>
                    <Text variant="bodyMedium" style={styles.modalText}>
                        By using this app, you agree to our terms of service. Please read them carefully.
                    </Text>
                </View>

                <View style={styles.modalSection}>
                    <Text variant="titleMedium" style={styles.sectionHeading}>Privacy Policy</Text>
                    <Text variant="bodyMedium" style={styles.modalText}>
                        We are committed to protecting your privacy and keeping your data secure.
                        Your personal information is never shared with third parties without your consent.
                    </Text>
                </View>

                <View style={styles.modalSection}>
                    <Text variant="bodySmall" style={styles.copyrightText}>
                        Last updated: January 2025
                    </Text>
                </View>
            </InfoModal>
        </View>
    );
};

const createStyles = (isDark: boolean) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: isDark ? '#0F172A' : '#F5F5F5',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 100,
    },
    headerBackground: {
        paddingBottom: spacing.xxl,
        paddingHorizontal: spacing.lg,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        marginBottom: spacing.lg,
    },
    headerContent: {
        paddingTop: spacing.md,
        paddingBottom: spacing.lg,
        maxWidth: 800,
        width: '100%',
        alignSelf: 'center',
    },
    headerTitle: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 28,
        textAlign: 'center',
    },
    sectionTitle: {
        fontWeight: '800',
        color: isDark ? '#94A3B8' : '#999',
        marginBottom: spacing.md,
        marginTop: spacing.lg,
        letterSpacing: 0.5,
        paddingHorizontal: spacing.lg,
        maxWidth: 800,
        width: '100%',
        alignSelf: 'center',
    },
    section: {
        borderRadius: 20,
        backgroundColor: isDark ? '#1E293B' : '#fff',
        overflow: 'hidden',
        marginHorizontal: spacing.lg,
        maxWidth: 800,
        width: '100%',
        alignSelf: 'center',
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.lg,
        gap: spacing.md,
    },
    settingIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    settingContent: {
        flex: 1,
    },
    settingTitle: {
        fontWeight: '700',
        color: isDark ? '#F1F5F9' : '#1A1A1A',
        marginBottom: 2,
    },
    settingDescription: {
        color: isDark ? '#CBD5E1' : '#666',
        fontSize: 12,
    },
    divider: {
        height: 1,
        backgroundColor: isDark ? '#334155' : '#F0F0F0',
        marginLeft: spacing.lg + 48 + spacing.md,
    },
    logoutContainer: {
        marginTop: spacing.xl,
        paddingHorizontal: spacing.lg,
        maxWidth: 800,
        width: '100%',
        alignSelf: 'center',
    },
    logoutButton: {
        borderRadius: 16,
        borderColor: '#EF4444',
    },
    appInfo: {
        alignItems: 'center',
        marginTop: spacing.xl,
        paddingHorizontal: spacing.lg,
        maxWidth: 800,
        width: '100%',
        alignSelf: 'center',
    },
    appInfoText: {
        color: isDark ? '#94A3B8' : '#999',
        marginVertical: 4,
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
        maxHeight: '80%',
    },
    modalSurface: {
        borderRadius: 24,
        backgroundColor: isDark ? '#1E293B' : '#fff',
        overflow: 'hidden',
    },
    modalHeader: {
        alignItems: 'center',
        padding: spacing.xl,
        borderBottomWidth: 1,
        borderBottomColor: isDark ? '#334155' : '#F0F0F0',
    },
    modalIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    modalTitle: {
        fontWeight: '700',
        color: isDark ? '#F1F5F9' : '#1A1A1A',
    },
    closeButton: {
        position: 'absolute',
        top: spacing.md,
        right: spacing.md,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: isDark ? '#334155' : '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalBody: {
        maxHeight: 400,
    },
    modalSection: {
        padding: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: isDark ? '#334155' : '#F5F5F5',
    },
    sectionHeading: {
        fontWeight: '700',
        color: isDark ? '#F1F5F9' : '#1A1A1A',
        marginBottom: spacing.sm,
    },
    modalText: {
        color: isDark ? '#CBD5E1' : '#666',
        lineHeight: 22,
    },
    appName: {
        fontWeight: '700',
        color: '#667EEA',
        marginBottom: spacing.xs,
    },
    versionText: {
        color: '#999',
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginVertical: spacing.xs,
    },
    featureText: {
        color: isDark ? '#CBD5E1' : '#666',
        flex: 1,
    },
    copyrightText: {
        color: '#999',
        textAlign: 'center',
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.md,
        backgroundColor: isDark ? '#0F172A' : '#F5F5F5',
        borderRadius: 12,
    },
    contactText: {
        color: '#667EEA',
        fontWeight: '600',
    },
});

export default SettingsScreen;
