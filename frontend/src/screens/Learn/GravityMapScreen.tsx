import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ImageBackground, Platform } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming, withDelay } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../context/ThemeContext';
import { spacing } from '../../theme';
import Svg, { Path, Line } from 'react-native-svg';
import { useWindowDimensions } from 'react-native';

// Add descriptions to topics
const TOPICS = [
    { id: 1, title: 'Gravitation', icon: 'earth', type: 'start', description: 'Understand the fundamental force that keeps our feet on the ground and planets in orbit.' },
    { id: 2, title: 'Universal Law Of Gravitation', icon: 'scale-balance', type: 'concept', description: 'Explore Newton\'s law that describes the attraction between any two masses in the universe.' },
    { id: 3, title: 'Free Fall', icon: 'parachute', type: 'concept', description: 'What happens when gravity is the only force acting on an object? Learn about free fall acceleration.' },
    { id: 4, title: 'To Calculate The Value Of G', icon: 'calculator', type: 'math', description: 'Derive the value of acceleration due to gravity (g) using Earth\'s mass and radius.' },
    { id: 5, title: 'Mass & Weight', icon: 'weight', type: 'concept', description: 'Discover the difference between the amount of matter in an object (Mass) and the force of gravity on it (Weight).' },
    { id: 6, title: 'Weight Of The Object On Moon', icon: 'moon-waning-crescent', type: 'space', description: 'Why do you weigh less on the Moon? Compare weight on Earth vs. the Moon.' },
    { id: 7, title: 'Thrust & Pressure', icon: 'arrow-down-compress', type: 'physics', description: 'Learn how force is distributed over an area to create pressure.' },
    { id: 8, title: 'Pressure In Fluids', icon: 'water', type: 'physics', description: 'Fluids exert pressure too! Understand how depth affects pressure associated with liquids.' },
    { id: 9, title: 'Buoyancy', icon: 'lifebuoy', type: 'physics', description: 'Why do things feel lighter in water? Uncover the upward force exerted by fluids.' },
    { id: 10, title: 'Why Objects Float Or Sink', icon: 'duck', type: 'question', description: 'The battle between density and buoyancy: determining if an object will float or sink.' },
    { id: 11, title: "Archimedes's Principle", icon: 'water-percent', type: 'law', description: 'The weight of displaced fluid equals the buoyant force. Master this key principle.' },
    { id: 12, title: 'Relative Density', icon: 'flask', type: 'end', description: 'Compare the density of a substance to water to understand its purity and flotation.' },
];

const GravityMapScreen = ({ navigation }: any) => {
    const { isDark } = useAppTheme();
    const insets = useSafeAreaInsets();
    const { width, height } = useWindowDimensions(); // Hook for responsiveness
    const [selectedTopic, setSelectedTopic] = useState<typeof TOPICS[0] | null>(null);
    const scrollViewRef = useRef<ScrollView>(null);

    // Auto-scroll to bottom slightly to show the start
    useEffect(() => {
        setTimeout(() => {
            // scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 500);
    }, []);

    const getPosition = (index: number) => {
        // Create a sine wave pattern
        // Responsive amplitude: 35% of width, but capped at 150 for tablets/desktop
        const xAmplitude = Math.min(width * 0.35, 160);
        const xCenter = width / 2;
        const ySpacing = 160; // Vertical distance between nodes

        // Start from bottom-ish
        const y = index * ySpacing + 100;
        // Adjusted frequency and phase to ensure it looks 'centered' overall
        // Math.sin(index * 0.8) makes first few go Right. 
        // Let's keep it but ensure the amplitude is safe.
        const x = xCenter + Math.sin(index * 0.6) * xAmplitude;

        return { x, y };
    };

    const renderPath = () => {
        let pathData = `M ${getPosition(0).x} ${getPosition(0).y}`;
        for (let i = 1; i < TOPICS.length; i++) {
            const prev = getPosition(i - 1);
            const curr = getPosition(i);

            // Bezier curve control points
            const cp1x = prev.x;
            const cp1y = prev.y + 80;
            const cp2x = curr.x;
            const cp2y = curr.y - 80;

            pathData += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
        }

        return (
            <Svg style={StyleSheet.absoluteFill} height={TOPICS.length * 160 + 200} width={width}>
                <Path
                    d={pathData}
                    stroke="rgba(255, 255, 255, 0.4)"
                    strokeWidth="8"
                    strokeDasharray="15, 10"
                    fill="none"
                />
            </Svg>
        );
    };

    const LevelNode = ({ item, index }: { item: typeof TOPICS[0], index: number }) => {
        const pos = getPosition(index);
        const isLeft = pos.x < width / 2;

        // Random floating animation delay
        const floatAnim = useSharedValue(0);

        useEffect(() => {
            floatAnim.value = withDelay(index * 100,
                withRepeat(
                    withSequence(
                        withTiming(-5, { duration: 1500 }),
                        withTiming(5, { duration: 1500 })
                    ),
                    -1,
                    true
                )
            );
        }, []);

        const animatedStyle = useAnimatedStyle(() => ({
            transform: [{ translateY: floatAnim.value }]
        }));

        return (
            <Animated.View
                // Disable entering animation on web to prevent "static flag missing" error
                entering={Platform.OS === 'web' ? undefined : FadeInDown.delay(index * 100).springify()}
                style={[
                    styles.nodeContainer,
                    {
                        left: pos.x - 40, // Center horizontally (width 80 / 2)
                        top: pos.y,
                        position: 'absolute'
                    },
                    animatedStyle
                ]}
            >
                {/* Text Label - alternating sides */}
                <View style={[
                    styles.labelContainer,
                    // Swap logic: If node is on left, put label on RIGHT (towards center)
                    isLeft ? styles.labelRight : styles.labelLeft,
                    // Ensure label doesn't go offscreen on mobile
                    { maxWidth: width * 0.45 }
                ]}>
                    <Text style={styles.nodeRefText}>{index + 1}</Text>
                    <Text style={styles.nodeTitle} numberOfLines={2}>{item.title}</Text>
                </View>

                {/* Node Button */}
                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setSelectedTopic(item)}
                    style={styles.touchableNode}
                >
                    <LinearGradient
                        colors={['#FFD700', '#FFA000']} // Gold generic color for "unlocked"
                        // Use different colors based on type or progress?
                        //  colors={index === 0 ? ['#4CAF50', '#66BB6A'] : ['#FFD700', '#FFA000']}
                        style={styles.nodeCircle}
                    >
                        <MaterialCommunityIcons name={item.icon as any} size={32} color="#fff" />

                        {/* Star Rating (fake for now) */}
                        <View style={styles.starsContainer}>
                            {[1, 2, 3].map((star, i) => (
                                <MaterialCommunityIcons
                                    key={i}
                                    name="star"
                                    size={12}
                                    color={i < 2 ? "#FFF" : "rgba(0,0,0,0.2)"}
                                />
                            ))}
                        </View>
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#2c3e50', '#2980b9', '#3498db']}
                style={StyleSheet.absoluteFill}
            />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Gravitation Map</Text>
                    <Text style={styles.headerSubtitle}>Master gravity level by level!</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                ref={scrollViewRef}
                style={styles.scrollView}
                contentContainerStyle={{
                    height: TOPICS.length * 160 + 250, // Ensure enough height for all nodes plus bottom padding
                    paddingBottom: 150
                }}
            >
                {/* Background Path */}
                {renderPath()}

                {/* Nodes */}
                {TOPICS.map((item, index) => (
                    <LevelNode key={item.id} item={item} index={index} />
                ))}
            </ScrollView>

            {/* Selection Modal/Overlay */}
            {selectedTopic && (
                <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
                    {/* Backdrop */}
                    <TouchableOpacity
                        style={styles.backdrop}
                        activeOpacity={1}
                        onPress={() => setSelectedTopic(null)}
                    />

                    {/* Card */}
                    <Animated.View
                        entering={FadeInDown.springify()}
                        style={[styles.infoCard, { paddingBottom: insets.bottom + 20 }]}
                    >
                        <LinearGradient
                            colors={['#fff', '#F0F9FF']}
                            style={styles.infoCardGradient}
                        >
                            <View style={styles.infoHeader}>
                                <View style={styles.infoIconBox}>
                                    <MaterialCommunityIcons name={selectedTopic.icon as any} size={40} color="#fff" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.infoTopicNum}>TOPIC {selectedTopic.id}</Text>
                                    <Text style={styles.infoTitle}>{selectedTopic.title}</Text>
                                </View>
                                <TouchableOpacity onPress={() => setSelectedTopic(null)} style={styles.closeButton}>
                                    <MaterialCommunityIcons name="close" size={24} color="#666" />
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.infoDesc}>{selectedTopic.description}</Text>

                            <TouchableOpacity
                                style={styles.startButton}
                                onPress={() => {
                                    setSelectedTopic(null);
                                    navigation.navigate('LessonReader', {
                                        title: selectedTopic.title,
                                        content: `Content for ${selectedTopic.title} coming soon!`, // Placeholder
                                        xpReward: 20,
                                        chapterId: 'gravity_basics', // Placeholder ID
                                        subjectId: 'science',
                                    });
                                }}
                            >
                                <LinearGradient colors={['#6366F1', '#4F46E5']} style={styles.startButtonGradient}>
                                    <Text style={styles.startButtonText}>START LESSON</Text>
                                    <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
                                </LinearGradient>
                            </TouchableOpacity>
                        </LinearGradient>
                    </Animated.View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
        backgroundColor: 'rgba(0,0,0,0.2)',
        zIndex: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#fff',
        textAlign: 'center',
    },
    headerSubtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
    },
    scrollView: {
        flex: 1,
    },
    nodeContainer: {
        width: 80,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
    },
    touchableNode: {
        width: 72,
        height: 72,
        borderRadius: 36,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
    },
    nodeCircle: {
        flex: 1,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#fff',
    },
    starsContainer: {
        flexDirection: 'row',
        position: 'absolute',
        bottom: -16,
        backgroundColor: '#FF5722',
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 2,
        gap: 2,
    },
    labelContainer: {
        position: 'absolute',
        backgroundColor: '#fff',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        maxWidth: 140,
        elevation: 4,
        top: 20,
    },
    labelLeft: {
        right: 90, // Push to left of the node
        alignItems: 'flex-end',
    },
    labelRight: {
        left: 90, // Push to right of the node
        alignItems: 'flex-start',
    },
    nodeRefText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#888',
        marginBottom: 2,
    },
    nodeTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#333',
        textAlign: 'center',
    },
    // NEW STYLES for Modal
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 20,
    },
    infoCard: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 21,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 20,
    },
    infoCardGradient: {
        padding: 24,
    },
    infoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    infoIconBox: {
        width: 60,
        height: 60,
        borderRadius: 20,
        backgroundColor: '#F59E0B',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    infoTopicNum: {
        fontSize: 12,
        fontWeight: '800',
        color: '#94A3B8',
        letterSpacing: 1,
        marginBottom: 4,
    },
    infoTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0F172A',
        lineHeight: 26,
    },
    closeButton: {
        padding: 8,
        backgroundColor: '#F1F5F9',
        borderRadius: 20,
    },
    infoDesc: {
        fontSize: 15,
        color: '#475569',
        lineHeight: 22,
        marginBottom: 24,
    },
    startButton: {
        width: '100%',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    startButtonGradient: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    startButtonText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 0.5,
    },
});

export default GravityMapScreen;
