import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, StatusBar, TextInput, useWindowDimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';

import { MODEL_REGISTRY } from '../data/modelRegistry';
import { spacing } from '../theme';
import Mobile3DModelViewer from '../components/learn/Mobile3DModelViewer';
import { useAppTheme } from '../context/ThemeContext';
import ScreenBackground from '../components/ScreenBackground';

const CATEGORIES = ['All', 'Physics', 'Chemistry', 'Biology', 'Astronomy'];

const MobileModelListScreen = () => {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const { isDark } = useAppTheme();
    const { width } = useWindowDimensions();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedModel, setSelectedModel] = useState<{ name: string; fileName: string } | null>(null);
    const [viewerVisible, setViewerVisible] = useState(false);

    // Calculate Grid Dimensions
    const cardGap = spacing.md;
    const padding = spacing.lg * 2;
    const availableWidth = width - padding;
    const cardWidth = (availableWidth - cardGap) / 2;

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

    return (
        <ScreenBackground style={styles.container}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* Scrollable Header - Matches Home Screen */}
                <LinearGradient
                    colors={isDark ? ['#0A1628', '#1E293B'] : ['#6366F1', '#8B5CF6', '#A855F7']}
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
                    <View style={[styles.searchContainer, isDark && styles.searchContainerDark]}>
                        <MaterialCommunityIcons name="magnify" size={20} color={isDark ? "#94A3B8" : "#666"} />
                        <TextInput
                            style={[styles.searchInput, isDark && styles.searchInputDark]}
                            placeholder="Search models..."
                            placeholderTextColor={isDark ? "#94A3B8" : "#999"}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <MaterialCommunityIcons name="close-circle" size={20} color={isDark ? "#94A3B8" : "#666"} />
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
                                        isDark && styles.categoryChipDark,
                                        selectedCategory === category && styles.categoryChipActive
                                    ]}
                                >
                                    <Text style={[
                                        styles.categoryText,
                                        isDark && styles.categoryTextDark,
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
                                        { width: cardWidth }
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
                                                { minHeight: 160 } // Reduced height for better grid feel
                                            ]}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                        >
                                            <View style={styles.modelIconContainer}>
                                                <View style={[styles.modelIconBg, { width: 42, height: 42, borderRadius: 21 }]}>
                                                    <MaterialCommunityIcons name="cube-scan" size={20} color="#fff" />
                                                </View>
                                            </View>

                                            <View style={styles.cardContentBottom}>
                                                <Text style={[styles.modelName, { fontSize: 15 }]} numberOfLines={2}>
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
                                <MaterialCommunityIcons name="cube-off-outline" size={64} color={isDark ? "#475569" : "#94A3B8"} />
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
        </ScreenBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    header: {
        paddingHorizontal: spacing.lg,
        paddingBottom: 50, // Space for overlap
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        overflow: 'hidden',
        zIndex: 1,
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
    searchContainerDark: {
        backgroundColor: '#1E293B',
        borderWidth: 1,
        borderColor: '#334155',
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#1A1A1A',
        padding: 0,
    },
    searchInputDark: {
        color: '#fff',
    },
    mainContentContainer: {
        marginTop: -30, // Increased overlap for better integration
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
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    categoryChipDark: {
        backgroundColor: '#1E293B',
        borderColor: '#334155',
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
    categoryTextDark: {
        color: '#CBD5E1',
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
        gap: spacing.md, // Ensure gap is applied
    },
    modelCardWrapper: {
        marginBottom: spacing.md,
        borderRadius: 24,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
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
