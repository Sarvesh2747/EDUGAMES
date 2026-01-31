import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Dimensions, TextInput } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';

import { MODEL_REGISTRY } from '../data/modelRegistry';
import { spacing } from '../theme';
import Mobile3DModelViewer from '../components/learn/Mobile3DModelViewer';
import { useAppTheme } from '../context/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');
const cardGap = spacing.md;
// Full width minus padding
const fullWidth = screenWidth - (spacing.lg * 2);
// Half width calculation
const halfWidth = (fullWidth - cardGap) / 2;

const CATEGORIES = ['All', 'Physics', 'Chemistry', 'Biology', 'Astronomy'];

const MobileModelListScreen = () => {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const { isDark } = useAppTheme();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedModel, setSelectedModel] = useState<{ name: string; fileName: string } | null>(null);
    const [viewerVisible, setViewerVisible] = useState(false);

    const models = Object.keys(MODEL_REGISTRY).map((key, index) => ({
        name: key,
        id: key,
        fileName: MODEL_REGISTRY[key as keyof typeof MODEL_REGISTRY],
        category: getCategoryForModel(key),
        gradientColors: getGradientForIndex(index),
    }));

    function getCategoryForModel(name: string): string {
        if (name.toLowerCase().includes('atom') || name.toLowerCase().includes('molecule')) return 'Chemistry';
        if (name.toLowerCase().includes('cell') || name.toLowerCase().includes('dna')) return 'Biology';
        if (name.toLowerCase().includes('planet') || name.toLowerCase().includes('solar')) return 'Astronomy';
        return 'Physics';
    }

    function getGradientForIndex(index: number): string[] {
        const gradients = [
            ['#8B5CF6', '#A855F7'], // Purple
            ['#3B82F6', '#60A5FA'], // Blue
            ['#10B981', '#34D399'], // Green
            ['#F59E0B', '#FBBF24'], // Amber
            ['#EF4444', '#F87171'], // Red
            ['#EC4899', '#F472B6'], // Pink
        ];
        return gradients[index % gradients.length];
    }

    const filteredModels = models.filter(model => {
        const matchesSearch = model.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || model.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const handleModelPress = (model: any) => {
        setSelectedModel({ name: model.name, fileName: model.fileName });
        setViewerVisible(true);
    };

    // Starry background component
    const renderStars = () => {
        const stars = [];
        for (let i = 0; i < 80; i++) {
            stars.push(
                <View
                    key={i}
                    style={[
                        styles.star,
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

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            {/* Unified App Background */}
            <LinearGradient
                colors={isDark ? ['#0A1628', '#0F172A', '#1E293B'] : ['#F0F9FF', '#E0F2FE', '#BAE6FD']}
                style={[StyleSheet.absoluteFill, { zIndex: -1 }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            {/* Starry Background for Dark Mode */}
            {isDark && (
                <View style={styles.starsContainer}>
                    {renderStars()}
                </View>
            )}

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* Scrollable Header */}
                <LinearGradient
                    colors={['#6366F1', '#8B5CF6', '#A855F7']}
                    style={[styles.header, { paddingTop: insets.top + 8 }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    {/* Header Content */}
                    <View style={styles.headerContent}>
                        <TouchableOpacity onPress={() => navigation.navigate('HomeTab' as any)} style={styles.backButton}>
                            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>3D Models</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    {/* Search Bar */}
                    <View style={styles.searchContainer}>
                        <MaterialCommunityIcons name="magnify" size={20} color="#666" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search models..."
                            placeholderTextColor="#999"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <MaterialCommunityIcons name="close-circle" size={20} color="#666" />
                            </TouchableOpacity>
                        )}
                    </View>
                </LinearGradient>

                {/* Overlapping Content Container */}
                <View style={styles.mainContentContainer}>
                    {/* Category Filters */}
                    <Animated.View entering={FadeInDown.delay(100)} style={styles.categoriesContainer}>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.categoriesScroll}
                        >
                            {CATEGORIES.map((category, index) => (
                                <TouchableOpacity
                                    key={category}
                                    onPress={() => setSelectedCategory(category)}
                                    style={[
                                        styles.categoryChip,
                                        selectedCategory === category && styles.categoryChipActive
                                    ]}
                                >
                                    <Text style={[
                                        styles.categoryText,
                                        selectedCategory === category && styles.categoryTextActive
                                    ]}>
                                        {category}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </Animated.View>

                    {/* Models Grid */}
                    <View style={styles.content}>
                        <View style={styles.modelsGrid}>
                            {filteredModels.map((model, index) => (
                                <Animated.View
                                    key={model.id}
                                    entering={FadeInRight.delay(index * 80)}
                                    style={[
                                        styles.modelCardWrapper,
                                        { width: halfWidth }
                                    ]}
                                >
                                    <TouchableOpacity
                                        activeOpacity={0.9}
                                        onPress={() => handleModelPress(model)}
                                    >
                                        <LinearGradient
                                            colors={[...model.gradientColors, model.gradientColors[1] + 'CC'] as any}
                                            style={[
                                                styles.modelCard,
                                                { minHeight: 220 }
                                            ]}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                        >
                                            <View style={styles.modelIconContainer}>
                                                <View style={[styles.modelIconBg, { width: 48, height: 48, borderRadius: 24 }]}>
                                                    <MaterialCommunityIcons name="cube-scan" size={24} color="#fff" />
                                                </View>
                                            </View>

                                            <View style={styles.cardContentBottom}>
                                                <Text style={[styles.modelName, { fontSize: 16 }]} numberOfLines={2}>
                                                    {model.name}
                                                </Text>
                                                <View style={styles.categoryBadge}>
                                                    <Text style={styles.categoryBadgeText}>{model.category}</Text>
                                                </View>
                                            </View>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </Animated.View>
                            ))}
                        </View>

                        {filteredModels.length === 0 && (
                            <Animated.View entering={FadeInDown} style={styles.emptyState}>
                                <MaterialCommunityIcons name="cube-off-outline" size={64} color="#94A3B8" />
                                <Text style={styles.emptyText}>No models found</Text>
                                <Text style={styles.emptySubtext}>Try a different search or category</Text>
                            </Animated.View>
                        )}
                    </View>
                </View>
            </ScrollView>

            {/* 3D Model Viewer */}
            {selectedModel && (
                <Mobile3DModelViewer
                    visible={viewerVisible}
                    title={selectedModel.name}
                    modelSource={selectedModel.fileName}
                    onClose={() => setViewerVisible(false)}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
    scrollView: {
        flex: 1,
    },
    header: {
        paddingHorizontal: spacing.lg,
        paddingBottom: 50, // Increased to allow overlap
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        overflow: 'hidden',
        zIndex: 1, // Keep behind content overlap if needed, though scroll order handles it mostly
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.md,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        gap: spacing.sm,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#1A1A1A',
        padding: 0,
    },
    mainContentContainer: {
        marginTop: -15, // Overlap effect (Adjusted)
        zIndex: 10,
    },
    categoriesContainer: {
        paddingVertical: spacing.md,
    },
    categoriesScroll: {
        paddingHorizontal: spacing.lg,
        gap: spacing.sm,
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.9)', // Slightly more opaque for overlap visibility
        borderWidth: 1,
        borderColor: '#E0E0E0',
        elevation: 2, // Added shadow for pop
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    categoryChipActive: {
        backgroundColor: '#6366F1',
        borderColor: '#6366F1',
    },
    categoryText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
    },
    categoryTextActive: {
        color: '#fff',
    },
    content: {
        paddingHorizontal: spacing.lg,
    },
    modelsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    modelCardWrapper: {
        marginBottom: spacing.md,
        borderRadius: 24,
        overflow: 'hidden',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    modelCard: {
        padding: spacing.md,
        height: '100%',
        justifyContent: 'space-between',
    },
    modelIconContainer: {
        alignItems: 'flex-start',
    },
    modelIconBg: {
        backgroundColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    cardContentBottom: {
        marginTop: spacing.md,
    },
    modelName: {
        fontWeight: '800',
        color: '#fff',
        marginBottom: spacing.xs,
        textShadowColor: 'rgba(0,0,0,0.2)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    categoryBadge: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(0,0,0,0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    categoryBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: 'rgba(255,255,255,0.9)',
        textTransform: 'uppercase',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: spacing.xxl * 2,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#94A3B8',
        marginTop: spacing.md,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#CBD5E1',
        marginTop: spacing.sm,
    },
});

export default MobileModelListScreen;
