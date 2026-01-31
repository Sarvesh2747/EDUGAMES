import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, StatusBar, ImageBackground, Dimensions, Platform, Image, Animated as RNAnimated, Pressable, useWindowDimensions } from 'react-native';
import { Text, Surface, ProgressBar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';
import { useResponsive } from '../hooks/useResponsive';
import Animated, { FadeInDown, FadeInUp, FadeInRight, withSpring, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useTranslation } from '../i18n';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import StreakCelebration from '../components/StreakCelebration';
import SimulationViewer from '../components/learn/SimulationViewer';
import { getAllSimulations, Simulation } from '../data/phetMappings';
import OnboardingTutorial from '../components/OnboardingTutorial';
import ConfettiAnimation from '../components/ConfettiAnimation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AVATAR_OPTIONS } from '../data/avatars'; // Shared Avatar Data
import { spacing } from '../theme';

// const { width } = Dimensions.get('window');

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const ScaleButton = ({ onPress, style, children, ...props }: any) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }]
    }));

    const onPressIn = () => {
        scale.value = withSpring(0.95);
    };

    const onPressOut = () => {
        scale.value = withSpring(1);
    };

    return (
        <AnimatedPressable
            onPress={onPress}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            style={[style, animatedStyle]}
            {...props}
        >
            {children}
        </AnimatedPressable>
    );
};

const HomeScreen = ({ navigation }: any) => {
    const { user, xp, streak, level } = useAuth();
    const { isDark, toggleTheme } = useAppTheme();
    const insets = useSafeAreaInsets();
    const { isMobile } = useResponsive();
    const { width } = useWindowDimensions();
    const { t } = useTranslation();
    const [showStreakCelebration, setShowStreakCelebration] = useState(false);
    const [selectedSim, setSelectedSim] = useState<Simulation | null>(null);
    const [viewerVisible, setViewerVisible] = useState(false);

    const styles = getStyles(isDark, width);

    const [showConfetti, setShowConfetti] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [prevLevel, setPrevLevel] = useState(level);

    // 🎉 Level Up Effect
    useEffect(() => {
        if (level > prevLevel) {
            setShowConfetti(true);
            setPrevLevel(level);
        }
    }, [level, prevLevel]);

    // 👶 Onboarding Check
    useEffect(() => {
        const checkOnboarding = async () => {
            const completed = await AsyncStorage.getItem('onboardingCompleted');
            if (!completed) {
                setShowOnboarding(true);
            }
        };
        checkOnboarding();
    }, []);

    // Stats Logic - Total XP Progress (using level from database)
    const xpForCurrentLevel = (level - 1) * 150;
    const xpForNextLevel = level * 150;
    const currentLevelXP = xp - xpForCurrentLevel;
    const xpNeededForLevel = xpForNextLevel - xpForCurrentLevel;
    const levelProgress = (currentLevelXP / xpNeededForLevel) * 100;
    const totalXP = xp;
    const featuredSimulations = getAllSimulations().slice(0, 4);

    // Starry background component
    const renderStars = () => {
        const stars = [];
        const starStyles = styles;
        for (let i = 0; i < 80; i++) {
            stars.push(
                <View
                    key={i}
                    style={[
                        starStyles.star,
                        {
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            width: Math.random() * 3 + 1,
                            height: Math.random() * 3 + 1,
                            opacity: Math.random() * 0.8 + 0.2,
                        },
                    ]}
                />
            );
        }
        return stars;
    };

    // 🖼️ SIMULATION IMAGE MAPPING
    const getSimImage = (title: string, subject: string) => {
        const titleLower = title.toLowerCase();
        if (titleLower.includes('wave')) return require('../../assets/simulations/waves_intro.png');
        if (titleLower.includes('buoyancy') && titleLower.includes('basic')) return require('../../assets/simulations/buoyancy_basics.png');
        if (titleLower.includes('buoyancy')) return require('../../assets/simulations/buoyancy.png');
        if (titleLower.includes('faraday') || titleLower.includes('electricity') || titleLower.includes('magn')) return require('../../assets/simulations/faraday.png');

        if (titleLower.includes('atom')) return { uri: 'https://images.unsplash.com/photo-1632922267756-9b712429a54f?q=80&w=800&auto=format&fit=crop' };
        if (titleLower.includes('gene') || titleLower.includes('cell')) return { uri: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?q=80&w=800&auto=format&fit=crop' };

        // Subject Fallbacks
        if (subject === 'Physics') return { uri: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?q=80&w=800&auto=format&fit=crop' };
        if (subject === 'Chemistry') return { uri: 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?q=80&w=800&auto=format&fit=crop' };
        if (subject === 'Biology') return { uri: 'https://images.unsplash.com/photo-1530210124550-912dc1381cb8?q=80&w=800&auto=format&fit=crop' };
        return { uri: 'https://images.unsplash.com/photo-1614728263952-84ea256f9679?q=80&w=800&auto=format&fit=crop' };
    };

    // Avatar Logic (Matches ProfileScreen)
    const selectedAvatarId = parseInt(user?.avatar || '1');
    const currentAvatar = AVATAR_OPTIONS.find(a => a.id === selectedAvatarId) || AVATAR_OPTIONS[0];

    // 🎨 APP THEME COLORS (Deep Violet/Teal/Orange)
    const THEME_GRADIENT = {
        primary: ['#6366F1', '#4F46E5'], // Violet
        secondary: ['#0EA5E9', '#0284C7'], // Sky Blue
        accent: ['#F59E0B', '#D97706'], // Amber
        success: ['#10B981', '#059669'], // Emerald
        rose: ['#EC4899', '#BE185D'], // Pink
    };

    // 🎮 UNSTRUCTURED BENTO GRID ITEMS
    const BENTO_ITEMS = [
        // Row 1: Learn Core
        {
            id: 'lessons', label: t('home.lessons'), subtitle: 'Start Learning',
            icon: 'book-open-variant', size: 'large',
            gradient: ['#4F46E5', '#4338CA'], // Deep Indigo
            route: 'Learn', screen: 'LearnDashboard',
            colSpan: 8, height: 130
        },
        {
            id: 'quiz', label: t('home.quiz'), subtitle: '',
            icon: 'brain', size: 'small',
            gradient: ['#EC4899', '#BE185D'], // Pink
            route: 'Learn', screen: 'Quiz',
            colSpan: 4, height: 130
        },

        // Row 2: Games (Banner)
        {
            id: 'games', label: t('home.games'), subtitle: 'Play Games',
            icon: 'gamepad-variant', size: 'large',
            gradient: ['#10B981', '#059669'], // Emerald
            route: 'Games',
            colSpan: 12, height: 110
        },

        // Row 3: Stats & Utils (Small)
        { id: 'leaderboard', label: 'Ranks', icon: 'podium', gradient: ['#F59E0B', '#D97706'], route: 'Leaderboard', colSpan: 3, height: 100 },
        { id: 'rewards', label: 'Rewards', icon: 'trophy', gradient: ['#FBBF24', '#F59E0B'], route: 'Rewards', colSpan: 3, height: 100 },
        { id: 'ai', label: 'AI Tutor', icon: 'robot', gradient: ['#2DD4BF', '#0D9488'], route: 'Chatbot', colSpan: 3, height: 100 },
        { id: 'classroom', label: 'Class', icon: 'school', gradient: ['#8B5CF6', '#7C3AED'], route: 'Classroom', colSpan: 3, height: 100 },

        // Row 4: System
        { id: 'feedback', label: 'Feedback', icon: 'comment-text-outline', gradient: ['#94A3B8', '#64748B'], route: 'StudentFeedback', colSpan: 6, height: 100 },
        { id: 'sync', label: 'Sync Data', icon: 'cloud-sync', gradient: ['#334155', '#1E293B'], route: 'Sync', colSpan: 6, height: 100 },

        // Row 5: Science Interactive (Moved to end, narrower)
        {
            id: 'science_interactive', label: 'Science Interactive', subtitle: 'Explore 3D Models',
            icon: 'cube-outline', size: 'large',
            gradient: ['#ecfeff', '#cffafe'], // Cyan
            route: 'Learn', screen: 'ModelList',
            colSpan: 8, height: 90
        },
    ];

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={isDark ? ['#0A1628', '#0F172A', '#1E293B'] : ['#F0F9FF', '#E0F2FE', '#BAE6FD']}
                style={[StyleSheet.absoluteFill, { zIndex: -1 }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            {/* Starry Background */}
            {isDark && (
                <View style={styles.starsContainer}>
                    {renderStars()}
                </View>
            )}

            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* 🌟 PREMIUM HEADER (Profile + Stats) */}
                <LinearGradient
                    colors={isDark ? ['#0A1628', '#1E293B'] : ['#6366F1', '#8B5CF6', '#A855F7']}
                    style={[styles.headerBackground, isMobile && { paddingBottom: 30 }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <View style={[styles.headerContent, { paddingTop: insets.top + (isMobile ? 10 : spacing.lg), paddingHorizontal: isMobile ? 16 : 32 }]}>
                        {/* Profile Section */}
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
                                {!isMobile && <Text style={styles.greeting}>Welcome back,</Text>}
                                <Text style={[styles.userName, isMobile && { fontSize: 18 }]}>{user?.name?.split(' ')[0] || 'Student'}</Text>
                            </Animated.View>
                        </View>

                        {/* Stats: XP, Streak, Settings */}
                        <View style={[styles.statsContainer, isMobile && { gap: 8 }]}>
                            {/* Stats content remains same but container flexes */}
                            <Animated.View entering={FadeInDown.delay(300)} style={[styles.streakBadge, isMobile && { paddingHorizontal: 8, paddingVertical: 4, gap: 4 }]}>
                                <MaterialCommunityIcons name="fire" size={isMobile ? 16 : 24} color="#FF6B6B" />
                                <Text style={[styles.streakText, isMobile && { fontSize: 13 }]}>{streak}</Text>
                            </Animated.View>
                            {/* ... Toggles remain ... */}
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
                    </View>

                    {/* XP Progress Card - ULT COMPACT MOBILE */}
                    <View style={[styles.xpCardSection, isMobile && { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 0 }]}>
                        <View style={[styles.xpCard, isMobile && { padding: 10, borderRadius: 12, borderWidth: 0, backgroundColor: 'rgba(0,0,0,0.2)' }]}>
                            <View style={[styles.xpCardContent, isMobile && { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }]}>
                                {/* Mobile: Clean Row Layout */}
                                {isMobile ? (
                                    <>
                                        <View style={{ flex: 1 }}>
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Level {level}</Text>
                                                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: '600' }}>{currentLevelXP}/{xpNeededForLevel} XP</Text>
                                            </View>
                                            <View style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, overflow: 'hidden' }}>
                                                <View style={{ height: '100%', width: `${Math.min(levelProgress, 100)}%`, backgroundColor: '#FFD700' }} />
                                            </View>
                                        </View>
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <Text style={{ color: '#FFD700', fontSize: 14, fontWeight: '800' }}>{totalXP}</Text>
                                            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 9, fontWeight: '600' }}>TOTAL XP</Text>
                                        </View>
                                    </>
                                ) : (
                                    // Desktop / Tablet Layout (Original)
                                    <>
                                        <View style={styles.xpHeader}>
                                            <MaterialCommunityIcons name="star-four-points" size={20} color={isDark ? "#FFD700" : "#F59E0B"} />
                                            <Text style={styles.xpTitle}>Total XP</Text>
                                            <Text style={styles.xpValue}>{totalXP} XP</Text>
                                        </View>
                                        <View style={styles.progressContainer}>
                                            <LinearGradient
                                                colors={isDark ? ['#FFD700', '#FFA500'] : ['#FBBF24', '#F59E0B']}
                                                style={[styles.progressFill, { width: `${Math.min(levelProgress, 100)}%` }]}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 0 }}
                                            />
                                        </View>
                                        <Text style={styles.nextLevelText}>Level {level} • {currentLevelXP}/{xpNeededForLevel} XP to Level {level + 1}</Text>
                                    </>
                                )}
                            </View>
                        </View>
                    </View>
                </LinearGradient>

                {/* 🚀 MAIN CONTENT AREA (Overlapping Header) */}
                <View style={[styles.mainContainer, isMobile && { marginTop: -20 }]}>

                    {/* 📦 BENTO GRID (Unstructured but Aligned) */}
                    <View style={styles.bentoGrid}>
                        {BENTO_ITEMS.map((item, index) => {
                            // Custom Renderer for Science Banner
                            if (item.id === 'science_interactive') {
                                return (
                                    <ScaleButton
                                        key={item.id}
                                        style={[styles.bentoItem, { flexBasis: '100%', height: (item as any).height || 90 }]}
                                        onPress={() => navigation.navigate(item.route, { screen: item.screen })}
                                    >
                                        <Surface style={[styles.bentoSurface, { borderRadius: 20 }]} elevation={3}>
                                            <LinearGradient
                                                colors={item.gradient as any}
                                                start={{ x: 0, y: 0.5 }}
                                                end={{ x: 1, y: 0.5 }}
                                                style={{
                                                    flexDirection: 'row',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    paddingHorizontal: 24,
                                                    height: '100%',
                                                }}
                                            >
                                                {/* Watermark for Science Banner */}
                                                <MaterialCommunityIcons
                                                    name={item.icon as any}
                                                    size={100}
                                                    color="#0891B2"
                                                    style={{
                                                        position: 'absolute',
                                                        right: -10,
                                                        bottom: -20,
                                                        opacity: 0.1,
                                                        transform: [{ rotate: '-10deg' }]
                                                    }}
                                                />

                                                <View>
                                                    <Text style={{ fontSize: 20, fontWeight: '800', color: '#155E75' }}>{item.label}</Text>
                                                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#0E7490', marginTop: 4, letterSpacing: 0.5 }}>{item.subtitle?.toUpperCase()}</Text>
                                                </View>
                                                <View style={{ backgroundColor: 'rgba(255,255,255,0.9)', padding: 12, borderRadius: 16 }}>
                                                    <MaterialCommunityIcons name="cube-outline" size={30} color="#0891B2" />
                                                </View>
                                            </LinearGradient>
                                        </Surface>
                                    </ScaleButton>
                                );
                            }


                            let itemWidth: any;
                            // Dynamic Height scaling for mobile
                            const baseHeight = (item as any).height || 120;
                            const mobileHeight = baseHeight < 110 ? 90 : 100; // Cap max height on mobile
                            const itemHeight = isMobile ? mobileHeight : baseHeight;

                            if (isMobile) {
                                // Mobile Logic: More Aggressive 2-Column Layout
                                // Only span full width if it's explicitly a 12-col banner
                                if (item.colSpan >= 12) itemWidth = '100%';
                                else itemWidth = '48%'; // Tighter fit
                            } else {
                                // Desktop Logic: Keep existing precise percentages
                                const getSafeBasis = (span: number) => {
                                    if (span >= 12) return '100%';
                                    if (span >= 8) return '60%';
                                    if (span >= 6) return '45%';
                                    if (span >= 4) return '28%';
                                    return '20%';
                                };
                                itemWidth = getSafeBasis(item.colSpan);
                            }

                            const isLarge = item.colSpan > 4;

                            return (
                                <ScaleButton
                                    key={item.id}
                                    style={[styles.bentoItem, {
                                        flexBasis: itemWidth,
                                        height: itemHeight
                                    }]}
                                    onPress={() => navigation.navigate(item.route, { screen: item.screen })}
                                >
                                    <Surface style={styles.bentoSurface} elevation={2}>
                                        <LinearGradient
                                            colors={item.gradient as any}
                                            style={styles.bentoGradient}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                        >
                                            {/* Watermark Icon */}
                                            <MaterialCommunityIcons
                                                name={item.icon as any}
                                                size={80}
                                                color="#FFF"
                                                style={{
                                                    position: 'absolute',
                                                    right: -10,
                                                    bottom: -10,
                                                    opacity: 0.1,
                                                    transform: [{ rotate: '-15deg' }]
                                                }}
                                            />

                                            <MaterialCommunityIcons name={item.icon as any} size={isLarge ? 32 : 24} color="#fff" />
                                            <View>
                                                <Text style={[styles.bentoTitle, { fontSize: isLarge ? 18 : 14 }]}>{item.label}</Text>
                                                {isLarge && <Text style={styles.bentoSubtitle}>{item.subtitle}</Text>}
                                            </View>
                                        </LinearGradient>
                                    </Surface>
                                </ScaleButton>
                            );
                        })}
                    </View>

                    {/* 🧪 SIMULATIONS SECTION */}
                    <View style={styles.simSection}>
                        <View style={styles.sectionHeaderRow}>
                            <View>
                                <Text style={styles.sectionHeader}>Featured Simulations</Text>
                                <Text style={styles.sectionSubHeader}>Interactive 3D Models & Labs</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.exploreBtn}
                                onPress={() => navigation.navigate('Learn', { screen: 'SimulationList' })}
                            >
                                <Text style={styles.exploreBtnText}>Explore All</Text>
                                <MaterialCommunityIcons name="arrow-right" size={16} color="#4F46E5" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.simScroll}>
                            {featuredSimulations.map((sim, index) => {
                                const isPhysics = sim.subject === 'Physics';
                                const isChem = sim.subject === 'Chemistry';
                                const subColor = isPhysics ? '#6366F1' : isChem ? '#10B981' : '#F59E0B';
                                const subBg = isPhysics ? 'rgba(99, 102, 241, 0.1)' : isChem ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)';
                                const imageUrl = getSimImage(sim.title, sim.subject);

                                return (
                                    <View key={sim.fileName} style={styles.simCardWrapper}>
                                        <TouchableOpacity
                                            style={styles.simCardPremium}
                                            activeOpacity={0.9}
                                            onPress={() => {
                                                setSelectedSim(sim);
                                                setViewerVisible(true);
                                            }}
                                        >
                                            <View style={styles.simPreviewPremium}>
                                                <Image
                                                    source={imageUrl as any}
                                                    style={styles.simImage}
                                                    resizeMode="cover"
                                                />
                                                <LinearGradient
                                                    colors={['transparent', 'rgba(0,0,0,0.3)']}
                                                    style={styles.simImageOverlay}
                                                />
                                                <View style={[styles.playOverlay, { backgroundColor: subColor }]}>
                                                    <MaterialCommunityIcons name="play" size={20} color="#fff" />
                                                </View>
                                            </View>

                                            <View style={styles.simContentPremium}>
                                                <View style={[styles.simBadge, { backgroundColor: subBg }]}>
                                                    <Text style={[styles.simSubject, { color: subColor }]}>{sim.subject}</Text>
                                                </View>
                                                <Text numberOfLines={2} style={styles.simTitlePremium}>{sim.title}</Text>
                                            </View>
                                        </TouchableOpacity>
                                    </View>
                                );
                            })}
                        </ScrollView>
                    </View>
                </View>

                <View style={{ height: 120 }} />
            </ScrollView >

            <StreakCelebration
                visible={showStreakCelebration}
                streak={streak}
                onClose={() => setShowStreakCelebration(false)}
            />
            {
                selectedSim && (
                    <SimulationViewer
                        visible={viewerVisible}
                        title={selectedSim.title}
                        fileName={selectedSim.fileName}
                        onClose={() => setViewerVisible(false)}
                    />
                )
            }
            {/* Mobile / Global Overlays */}
            {isMobile && showConfetti && (
                <ConfettiAnimation
                    isVisible={true}
                    onComplete={() => setShowConfetti(false)}
                />
            )}

            {showOnboarding && (
                <OnboardingTutorial
                    onComplete={() => {
                        setShowOnboarding(false);
                        AsyncStorage.setItem('onboardingCompleted', 'true');
                    }}
                />
            )}
        </View >
    );
};

const getStyles = (isDark: boolean, width: number) => StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    starsContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
    },
    star: {
        position: 'absolute',
        backgroundColor: '#FFFFFF',
        borderRadius: 50,
    },
    // Header
    headerBackground: {
        paddingBottom: 60,
        // Mobile optimization: less bottom padding to pull content up
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
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 30,
        backgroundColor: '#fff',
    },
    greeting: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
        fontWeight: '500',
    },
    userName: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '700',
    },

    // Stats Header
    statsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    streakBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.3)',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: isDark ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255, 255, 255, 0.5)',
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
        backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.3)',
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.5)',
    },
    rewardsIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: isDark ? 'rgba(255, 215, 0, 0.2)' : 'rgba(255, 255, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255, 215, 0, 0.3)' : 'rgba(255, 255, 255, 0.5)',
    },
    xpCardSection: {
        paddingHorizontal: 32,
        paddingTop: 16,
        paddingBottom: 10, // Reduced from 20
        maxWidth: 1200,
        width: '100%',
        alignSelf: 'center',
    },
    xpCard: {
        backgroundColor: isDark ? 'rgba(91, 79, 232, 0.15)' : 'rgba(255, 255, 255, 0.25)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(91, 79, 232, 0.3)' : 'rgba(255, 255, 255, 0.4)',
    },
    xpCardContent: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    xpHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    xpTitle: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
    },
    xpValue: {
        color: isDark ? '#FFD700' : '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    progressContainer: {
        height: 8,
        backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    nextLevelText: {
        color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.9)',
        fontSize: 11,
        fontWeight: '600',
        textAlign: 'center',
    },

    // Main Content
    mainContainer: {
        marginTop: -60, // Overlap
        paddingHorizontal: Platform.OS === 'web' && width > 768 ? 24 : 16, // Reduced padding on mobile
        maxWidth: 1000,
        width: '100%',
        alignSelf: 'center',
    },

    // Hero
    heroCard: {
        marginBottom: 32,
        borderRadius: 24,
        elevation: 8,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
    },
    heroGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 24,
        borderRadius: 24,
        gap: 20,
    },
    heroIconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroContent: {
        flex: 1,
    },
    heroLabel: {
        color: '#A5B4FC',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
        marginBottom: 4,
    },
    heroTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },

    // Bento Grid
    bentoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Platform.OS === 'web' && width > 768 ? 16 : 12, // Smaller gap for mobile
        justifyContent: 'center', // Align center
    },
    bentoItem: {
        height: 120, // Uniform height for cleaner look
        flexGrow: 1,
    },
    bentoSurface: {
        flex: 1,
        borderRadius: 20,
        overflow: 'hidden',
    },
    bentoGradient: {
        flex: 1,
        padding: 16,
        justifyContent: 'space-between',
    },
    bentoTitle: {
        color: '#fff',
        fontWeight: '800',
    },
    bentoSubtitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
    },

    // Simulations
    simSection: {
        marginTop: 40,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 20,
        paddingHorizontal: 4,
    },
    sectionHeader: {
        fontSize: 20,
        fontWeight: '800',
        color: isDark ? '#F8FAFC' : '#1E293B',
    },
    sectionSubHeader: {
        fontSize: 14,
        color: isDark ? '#94A3B8' : '#64748B',
        marginTop: 4,
        fontWeight: '500',
    },
    exploreBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        padding: 8,
        backgroundColor: '#EEF2FF',
        borderRadius: 12,
    },
    exploreBtnText: {
        color: '#4F46E5',
        fontWeight: '700',
        fontSize: 13,
    },
    simScroll: {
        paddingHorizontal: 4,
        paddingBottom: 24,
    },
    simCardWrapper: {
        marginRight: 20,
    },
    simCardPremium: {
        width: Platform.OS === 'web' && width > 768 ? 200 : 160,
        backgroundColor: '#fff',
        borderRadius: 20,
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 4,
        overflow: 'hidden',
    },
    simPreviewPremium: {
        height: 120,
        backgroundColor: '#e2e8f0',
        position: 'relative',
    },
    simImage: {
        width: '100%',
        height: '100%',
    },
    simImageOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    playOverlay: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        borderRadius: 20,
        padding: 6,
        elevation: 4,
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    simContentPremium: {
        padding: 16,
        paddingTop: 12,
    },
    simBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginBottom: 8,
    },
    simTitlePremium: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1E293B',
        lineHeight: 20,
    },
    simSubject: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
});

export default HomeScreen;
