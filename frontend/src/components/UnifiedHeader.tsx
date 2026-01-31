import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';
import { useResponsive } from '../hooks/useResponsive';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AVATAR_OPTIONS } from '../data/avatars';
import { spacing } from '../theme';
import { useNavigation } from '@react-navigation/native';

interface UnifiedHeaderProps {
    title: string;
    subtitle?: string;
    icon?: string;
    hideStats?: boolean;
}

const UnifiedHeader = ({ title, subtitle, icon, hideStats = false }: UnifiedHeaderProps) => {
    const { user, streak } = useAuth();
    const { isDark, toggleTheme } = useAppTheme();
    const insets = useSafeAreaInsets();
    const { isMobile } = useResponsive();
    const navigation = useNavigation<any>();

    // Avatar Logic
    const selectedAvatarId = parseInt(user?.avatar || '1');
    const currentAvatar = AVATAR_OPTIONS.find(a => a.id === selectedAvatarId) || AVATAR_OPTIONS[0];

    const styles = getStyles(isDark);

    return (
        <LinearGradient
            colors={isDark ? ['#0A1628', '#1E293B'] : ['#6366F1', '#8B5CF6', '#A855F7']}
            style={styles.headerBackground}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            <View style={[styles.headerContent, { paddingTop: insets.top + (isMobile ? 20 : 36), paddingHorizontal: isMobile ? 16 : 32 }]}>
                {/* Profile / Title Section */}
                <View style={[styles.profileSection, isMobile && { gap: 10 }]}>
                    <TouchableOpacity onPress={() => navigation.navigate('Profile')} activeOpacity={0.8}>
                        <Animated.View entering={FadeInDown.delay(100)}>
                            <LinearGradient
                                colors={currentAvatar.gradient}
                                style={[styles.avatarBorder, isMobile && { width: 44, height: 44, padding: 2 }]}
                            >
                                <Image source={currentAvatar.source} style={styles.avatarImage} />
                            </LinearGradient>
                        </Animated.View>
                    </TouchableOpacity>
                    <Animated.View entering={FadeInRight.delay(200)}>
                        <Text style={[styles.greeting, isMobile && { fontSize: 13 }]}>{subtitle || 'Welcome back,'}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Text style={[styles.userName, isMobile && { fontSize: 18 }]}>{title || user?.name?.split(' ')[0]}</Text>
                            {icon && <MaterialCommunityIcons name={icon as any} size={isMobile ? 20 : 24} color="#FFF" style={{ opacity: 0.9 }} />}
                        </View>
                    </Animated.View>
                </View>

                {/* Stats: XP, Streak, Settings */}
                {!hideStats && (
                    <View style={[styles.statsContainer, isMobile && { gap: 8 }]}>
                        <Animated.View entering={FadeInDown.delay(300)} style={[styles.streakBadge, isMobile && { paddingHorizontal: 8, paddingVertical: 4, gap: 4 }]}>
                            <MaterialCommunityIcons name="fire" size={isMobile ? 16 : 24} color="#FF6B6B" />
                            <Text style={[styles.streakText, isMobile && { fontSize: 13 }]}>{streak}</Text>
                        </Animated.View>

                        <Animated.View entering={FadeInDown.delay(400)}>
                            <TouchableOpacity style={styles.darkModeToggle} onPress={toggleTheme}>
                                <View style={[styles.toggleGradient, isMobile && { width: 32, height: 32 }]}>
                                    <MaterialCommunityIcons name={isDark ? 'weather-sunny' : 'moon-waning-crescent'} size={16} color={isDark ? '#FCD34D' : '#fff'} />
                                </View>
                            </TouchableOpacity>
                        </Animated.View>

                        <Animated.View entering={FadeInDown.delay(500)}>
                            <TouchableOpacity style={styles.rewardsIcon} onPress={() => navigation.navigate('Rewards')}>
                                <View style={[styles.rewardsIcon, isMobile && { width: 32, height: 32 }]}>
                                    <MaterialCommunityIcons name="crown" size={18} color="#FFD700" />
                                </View>
                            </TouchableOpacity>
                        </Animated.View>
                    </View>
                )}
            </View>
        </LinearGradient>
    );
};

const getStyles = (isDark: boolean) => StyleSheet.create({
    headerBackground: {
        paddingBottom: 60,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 32,
        maxWidth: 1200,
        width: '100%',
        alignSelf: 'center',
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    avatarBorder: {
        width: 64,
        height: 64,
        borderRadius: 32,
        padding: 3,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 30,
        backgroundColor: '#fff',
    },
    greeting: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 2,
    },
    userName: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '700',
        letterSpacing: -0.5,
    },
    statsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    streakBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.2)',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: isDark ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255, 255, 255, 0.3)',
    },
    streakText: {
        color: isDark ? '#FCA5A5' : '#FFFFFF',
        fontWeight: '800',
        fontSize: 16,
    },
    darkModeToggle: {
        borderRadius: 14,
        overflow: 'hidden',
    },
    toggleGradient: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)',
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.3)',
    },
    rewardsIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: isDark ? 'rgba(255, 215, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255, 215, 0, 0.3)' : 'rgba(255, 255, 255, 0.3)',
    },
});

export default UnifiedHeader;
