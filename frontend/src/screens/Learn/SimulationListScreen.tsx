import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, StatusBar, Platform } from 'react-native';
import { Text, Surface, useTheme, Searchbar, Chip, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import SimulationViewer from '../../components/learn/SimulationViewer';
import { spacing, gradients, borderRadius } from '../../theme';
import { getAllSimulations, getSimulationsBySubject, Simulation } from '../../data/phetMappings'; // StreakWise Interactive Simulations
import Animated, { FadeInDown, FadeIn, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;
const isDesktop = width >= 1024;

const SimulationListScreen = ({ route, navigation }: any) => {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const { subchapterSims } = route.params || {};

    const [simulations, setSimulations] = useState<Simulation[]>([]);
    const [filteredSims, setFilteredSims] = useState<Simulation[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
    const [selectedSim, setSelectedSim] = useState<Simulation | null>(null);
    const [viewerVisible, setViewerVisible] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSimulations();
    }, []);

    useEffect(() => {
        filterSimulations();
    }, [searchQuery, selectedSubject, simulations]);

    const loadSimulations = () => {
        setLoading(true);
        // If coming from subchapter, use those sims, otherwise show all
        const sims = subchapterSims || getAllSimulations();
        setSimulations(sims);
        setFilteredSims(sims);
        setLoading(false);
    };

    const filterSimulations = () => {
        let filtered = simulations;

        // Filter by subject
        if (selectedSubject) {
            filtered = filtered.filter(sim => sim.subject === selectedSubject);
        }

        // Filter by search query
        if (searchQuery) {
            filtered = filtered.filter(sim =>
                sim.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                sim.description?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setFilteredSims(filtered);
    };

    const handleSimulationPress = (sim: Simulation) => {
        setSelectedSim(sim);
        setViewerVisible(true);
    };

    const subjects = ['Physics', 'Chemistry', 'Math', 'Biology'];

    const getSubjectIcon = (subject: string) => {
        const icons: Record<string, string> = {
            'Physics': 'atom',
            'Chemistry': 'flask',
            'Math': 'calculator',
            'Biology': 'dna'
        };
        return icons[subject] || 'school';
    };

    const getSubjectColor = (subject: string) => {
        const colors: Record<string, string> = {
            'Physics': '#2196F3',
            'Chemistry': '#4CAF50',
            'Math': '#FF9800',
            'Biology': '#9C27B0'
        };
        return colors[subject] || theme.colors.primary;
    };

    const getSubjectGradient = (subject: string) => {
        const gradients: Record<string, string[]> = {
            'Physics': ['#3B82F6', '#2563EB'],
            'Chemistry': ['#10B981', '#059669'],
            'Math': ['#F59E0B', '#D97706'],
            'Biology': ['#8B5CF6', '#7C3AED']
        };
        return gradients[subject] || ['#6366F1', '#4F46E5'];
    };

    const getGridColumns = () => {
        if (isDesktop) return 4;
        if (isTablet) return 3;
        return 2;
    };

    const renderSimulationCard = (sim: Simulation, index: number) => {
        const color = getSubjectColor(sim.subject);
        const gradient = getSubjectGradient(sim.subject);

        return (
            <Animated.View
                key={sim.fileName}
                entering={Platform.OS === 'web' ? undefined : FadeInDown.delay(index * 50).duration(400).springify()}
                style={[styles.cardWrapper, { width: `${100 / getGridColumns()}%` }]}
            >
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleSimulationPress(sim)}
                >
                    <Surface style={styles.card} elevation={3}>
                        <LinearGradient
                            colors={[gradient[0], gradient[1], gradient[1] + '40'] as const}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.cardGradient}
                        >
                            <View style={styles.iconContainer}>
                                <MaterialCommunityIcons
                                    name={getSubjectIcon(sim.subject) as any}
                                    size={48}
                                    color="#fff"
                                />
                            </View>
                        </LinearGradient>

                        <View style={styles.cardContent}>
                            <Text variant="titleSmall" style={styles.cardTitle} numberOfLines={2}>
                                {sim.title}
                            </Text>
                            {sim.description && (
                                <Text variant="bodySmall" style={styles.cardDescription} numberOfLines={2}>
                                    {sim.description}
                                </Text>
                            )}
                            <View style={[styles.subjectBadge, { backgroundColor: color + '15' }]}>
                                <Text variant="labelSmall" style={[styles.subjectText, { color }]}>
                                    {sim.subject}
                                </Text>
                            </View>
                        </View>
                    </Surface>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            {/* Modern Clean Header */}
            <LinearGradient
                colors={['#1E293B', '#334155', '#475569']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.headerBackground, { paddingTop: insets.top + spacing.md }]}
            >
                <Animated.View entering={Platform.OS === 'web' ? undefined : FadeInDown.duration(500)} style={styles.headerContent}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity onPress={() => navigation.navigate('HomeTab' as any)} style={styles.backButton}>
                            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
                        </TouchableOpacity>
                        <View style={styles.headerTitleContainer}>
                            <Text variant="headlineMedium" style={styles.headerTitle}>
                                Simulations
                            </Text>
                        </View>
                        <View style={{ width: 40 }} />
                    </View>
                    <Text variant="bodyMedium" style={styles.headerSubtitle}>
                        Interactive science learning experiences
                    </Text>
                </Animated.View>
            </LinearGradient>

            <View style={styles.contentContainer}>
                {/* Search */}
                <Animated.View entering={Platform.OS === 'web' ? undefined : FadeInUp.delay(200).duration(600)} style={styles.searchContainer}>
                    <Searchbar
                        placeholder="Search simulations..."
                        onChangeText={setSearchQuery}
                        value={searchQuery}
                        style={styles.searchBar}
                        inputStyle={styles.searchInput}
                        iconColor={theme.colors.primary}
                        elevation={4}
                    />
                </Animated.View>

                {/* Subject Filter */}
                {!subchapterSims && (
                    <Animated.View entering={Platform.OS === 'web' ? undefined : FadeInUp.delay(300).duration(600)}>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.filterContainer}
                            contentContainerStyle={styles.filterContent}
                        >
                            <Chip
                                selected={selectedSubject === null}
                                onPress={() => setSelectedSubject(null)}
                                style={[styles.chip, selectedSubject === null && styles.selectedChip]}
                                textStyle={[styles.chipText, selectedSubject === null && styles.selectedChipText]}
                                showSelectedOverlay
                                mode="flat"
                            >
                                All
                            </Chip>
                            {subjects.map(subject => (
                                <Chip
                                    key={subject}
                                    selected={selectedSubject === subject}
                                    onPress={() => setSelectedSubject(subject)}
                                    icon={getSubjectIcon(subject)}
                                    style={[
                                        styles.chip,
                                        selectedSubject === subject && [
                                            styles.selectedChip,
                                            { backgroundColor: getSubjectColor(subject) }
                                        ]
                                    ]}
                                    textStyle={[styles.chipText, selectedSubject === subject && styles.selectedChipText]}
                                    showSelectedOverlay
                                    mode="flat"
                                >
                                    {subject}
                                </Chip>
                            ))}
                        </ScrollView>
                    </Animated.View>
                )}

                {/* Results Count */}
                {!loading && (
                    <Animated.View entering={Platform.OS === 'web' ? undefined : FadeIn.delay(400)} style={styles.resultsContainer}>
                        <Text variant="bodyMedium" style={styles.resultsText}>
                            {filteredSims.length} {filteredSims.length === 1 ? 'simulation' : 'simulations'} found
                        </Text>
                    </Animated.View>
                )}

                {/* Simulations Grid */}
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                        <Text variant="bodyMedium" style={{ marginTop: spacing.md, color: '#666' }}>
                            Loading simulations...
                        </Text>
                    </View>
                ) : filteredSims.length === 0 ? (
                    <Animated.View entering={Platform.OS === 'web' ? undefined : FadeIn.duration(600)} style={styles.emptyContainer}>
                        <View style={styles.emptyIconContainer}>
                            <MaterialCommunityIcons name="flask-empty-outline" size={80} color="#ccc" />
                        </View>
                        <Text variant="titleMedium" style={styles.emptyTitle}>
                            No simulations found
                        </Text>
                        <Text variant="bodyMedium" style={styles.emptySubtitle}>
                            Try adjusting your search or filters
                        </Text>
                    </Animated.View>
                ) : (
                    <ScrollView
                        contentContainerStyle={styles.gridContainer}
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.grid}>
                            {filteredSims.map((sim, index) => renderSimulationCard(sim, index))}
                        </View>
                    </ScrollView>
                )}

                {/* Simulation Viewer Modal */}
                {selectedSim && (
                    <SimulationViewer
                        visible={viewerVisible}
                        title={selectedSim.title}
                        fileName={selectedSim.fileName}
                        onClose={() => setViewerVisible(false)}
                    />
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
    headerBackground: {
        paddingBottom: spacing.xxl,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        overflow: 'hidden',
    },
    headerContent: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.sm,
        paddingBottom: spacing.md,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        flex: 1,
        justifyContent: 'center',
    },
    contentContainer: {
        flex: 1,
        marginTop: -spacing.xl,
    },
    backButton: {
        padding: 10,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 12,
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontWeight: '700',
        color: '#fff',
        fontSize: 24,
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        color: 'rgba(255,255,255,0.85)',
        textAlign: 'center',
        marginTop: spacing.xs,
        fontSize: 13,
    },
    searchContainer: {
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.md,
    },
    searchBar: {
        backgroundColor: '#fff',
        borderRadius: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    searchInput: {
        minHeight: 50,
    },
    filterContainer: {
        marginBottom: spacing.md,
        maxHeight: 50,
    },
    filterContent: {
        paddingHorizontal: spacing.lg,
        gap: spacing.sm,
        alignItems: 'center',
    },
    chip: {
        marginRight: spacing.sm,
        backgroundColor: '#F3F4F6',
        height: 40,
        borderWidth: 0,
        borderRadius: 12,
    },
    selectedChip: {
        backgroundColor: '#1E293B',
        borderColor: '#1E293B',
    },
    chipText: {
        color: '#666',
        fontWeight: '600',
    },
    selectedChipText: {
        color: '#fff',
        fontWeight: '700',
    },
    resultsContainer: {
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.sm,
    },
    resultsText: {
        color: '#666',
        fontWeight: '600',
    },
    gridContainer: {
        padding: spacing.md,
        paddingBottom: 40,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    cardWrapper: {
        padding: spacing.sm,
    },
    card: {
        borderRadius: 16,
        backgroundColor: '#fff',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    cardGradient: {
        height: 130,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconContainer: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    cardContent: {
        padding: spacing.md,
    },
    cardTitle: {
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: spacing.sm,
        minHeight: 38,
        fontSize: 14,
        color: '#1F2937',
        lineHeight: 19,
    },
    cardDescription: {
        textAlign: 'center',
        color: '#6B7280',
        marginBottom: spacing.md,
        minHeight: 32,
        fontSize: 11.5,
        lineHeight: 17,
    },
    subjectBadge: {
        paddingVertical: 5,
        paddingHorizontal: 12,
        borderRadius: 8,
        alignSelf: 'center',
    },
    subjectText: {
        fontWeight: '700',
        fontSize: 10,
        letterSpacing: 0.3,
        textTransform: 'uppercase',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        paddingHorizontal: spacing.xl,
    },
    emptyIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    emptyTitle: {
        marginTop: spacing.md,
        color: '#333',
        fontWeight: '700',
    },
    emptySubtitle: {
        marginTop: spacing.xs,
        color: '#999',
        textAlign: 'center',
    },
});

export default SimulationListScreen;
