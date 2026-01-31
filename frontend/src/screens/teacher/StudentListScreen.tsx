import React, { useState, useEffect, useMemo } from 'react';
import { View, FlatList, StyleSheet, Text, TouchableOpacity, ActivityIndicator, Alert, TextInput, useWindowDimensions, Modal, ScrollView, Pressable } from 'react-native';
import { Portal, Dialog, Button, Paragraph } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenBackground from '../../components/ScreenBackground';
import CompactHeader from '../../components/ui/CompactHeader';
import { useAppTheme } from '../../context/ThemeContext';
import { useResponsive } from '../../hooks/useResponsive';
import api from '../../services/api';

const StudentListScreen = () => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { isDark, theme } = useAppTheme();
    const { isMobile, containerStyle } = useResponsive();
    const { width } = useWindowDimensions();

    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    // Filter States
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [selectedClass, setSelectedClass] = useState('All');
    const [selectedLearnerType, setSelectedLearnerType] = useState('All');

    // Delete Dialog State
    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [studentToDelete, setStudentToDelete] = useState<any>(null);

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const response = await api.get('/teacher/students');
            setStudents(response.data);
        } catch (error) {
            console.error('❌ Fetch error:', error);
            Alert.alert('Error', 'Failed to fetch students');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleDelete = (id: string, name: string) => {
        setStudentToDelete({ id, name });
        setDeleteDialogVisible(true);
    };

    const confirmDelete = async () => {
        if (!studentToDelete) return;

        try {
            await api.delete(`/teacher/student/${studentToDelete.id}`);
            await fetchStudents();
        } catch (error) {
            console.error('Delete error:', error);
            Alert.alert('Error', 'Failed to delete student');
        } finally {
            setDeleteDialogVisible(false);
            setStudentToDelete(null);
        }
    };

    // Derived Data
    const uniqueClasses = useMemo(() => {
        const classes = new Set(students.map((s: any) => s.selectedClass).filter(Boolean));
        return ['All', ...Array.from(classes).sort()];
    }, [students]);

    const filteredStudents = useMemo(() => {
        return students.filter((student: any) => {
            const matchesSearch =
                student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                student.email.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesClass = selectedClass === 'All' || student.selectedClass?.toString() === selectedClass.toString();

            const matchesType = selectedLearnerType === 'All'
                ? true
                : selectedLearnerType === 'Average'
                    ? (!student.learnerCategory || student.learnerCategory === 'neutral' || student.learnerCategory === 'average')
                    : student.learnerCategory === selectedLearnerType.toLowerCase();

            return matchesSearch && matchesClass && matchesType;
        });
    }, [students, searchQuery, selectedClass, selectedLearnerType]);

    const getLearnerColors = (category: string) => {
        if (category === 'fast') return { bg: '#4F46E5', text: '#fff', label: 'Fast', icon: 'lightning-bolt' as const };
        if (category === 'slow') return { bg: '#F59E0B', text: '#fff', label: 'Slow', icon: 'turtle' as const };
        return { bg: '#64748B', text: '#fff', label: 'Normal', icon: 'account' as const };
    };

    const renderItem = ({ item }: { item: any }) => {
        const learner = getLearnerColors(item.learnerCategory);
        const randomColorIndex = (item.name.length + (item.email?.length || 0)) % 5;
        const colors = [
            ['#4F46E5', '#818CF8'], // Indigo
            ['#EC4899', '#F472B6'], // Pink
            ['#10B981', '#34D399'], // Emerald
            ['#F59E0B', '#FCD34D'], // Amber
            ['#3B82F6', '#60A5FA'], // Blue
        ];
        const avatarGradient = colors[randomColorIndex] as [string, string];

        return (
            <View style={[
                styles.card,
                { backgroundColor: isDark ? '#1E293B' : '#fff' },
                isMobile && styles.cardMobile
            ]}>
                <View style={[styles.cardContent, isMobile && { flexDirection: 'column', alignItems: 'flex-start' }]}>
                    {/* User Info Section */}
                    <View style={styles.userSection}>
                        <LinearGradient
                            colors={avatarGradient}
                            style={styles.avatar}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Text style={styles.avatarText}>{item.name.substring(0, 2).toUpperCase()}</Text>
                        </LinearGradient>

                        <View style={styles.userInfo}>
                            <View style={styles.nameRow}>
                                <Text style={[styles.name, { color: isDark ? '#fff' : '#1E293B' }]}>
                                    {item.name}
                                </Text>
                            </View>
                            <Text style={[styles.email, { color: isDark ? '#94A3B8' : '#64748B' }]}>{item.email}</Text>
                            <View style={styles.metaRow}>
                                <MaterialCommunityIcons name="school" size={14} color={isDark ? '#64748B' : '#94A3B8'} />
                                <Text style={[styles.grade, { color: isDark ? '#94A3B8' : '#64748B' }]}>Class {item.selectedClass}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Quick Stats/Badges Section - Desktop: Right aligned, Mobile: Below name */}
                    <View style={[styles.badgesSection, isMobile && { marginTop: 12, width: '100%', flexDirection: 'row', justifyContent: 'flex-start' }]}>
                        <View style={[styles.statusBadge, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#D1FAE5' }]}>
                            <Text style={[styles.statusText, { color: '#059669' }]}>ACTIVE</Text>
                        </View>

                        {item.learnerCategory && item.learnerCategory !== 'neutral' && (
                            <View style={[styles.learnerBadge, { backgroundColor: learner.bg }]}>
                                <MaterialCommunityIcons name={learner.icon} size={12} color="#fff" />
                                <Text style={styles.learnerText}>{learner.label}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Actions Row */}
                <View style={[styles.actionsRow, isMobile && { marginTop: 16 }]}>
                    <TouchableOpacity
                        style={styles.analyticsButton}
                        onPress={() => (navigation as any).navigate('StudentAnalytics', {
                            studentId: item._id,
                            studentName: item.name
                        })}
                    >
                        <MaterialCommunityIcons name="chart-line" size={20} color="#fff" />
                        <Text style={styles.analyticsButtonText}>Analytics</Text>
                    </TouchableOpacity>

                    <View style={styles.iconButtons}>
                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={() => (navigation as any).navigate('EditStudent', { student: item })}
                        >
                            <LinearGradient
                                colors={['#3B82F6', '#2563EB']}
                                style={styles.iconGradient}
                            >
                                <MaterialCommunityIcons name="pencil" size={18} color="#fff" />
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={() => handleDelete(item._id, item.name)}
                        >
                            <LinearGradient
                                colors={['#EF4444', '#DC2626']}
                                style={styles.iconGradient}
                            >
                                <MaterialCommunityIcons name="delete" size={18} color="#fff" />
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <ScreenBackground style={styles.container}>
            <CompactHeader
                title="My Students"
                subtitle={`${filteredStudents.length} / ${students.length} students showing`}
                onBack={() => navigation.goBack()}
                rightComponent={
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => (navigation as any).navigate('CreateStudent')}
                    >
                        <MaterialCommunityIcons name="plus" size={24} color="#4F46E5" />
                    </TouchableOpacity>
                }
            />

            <View style={[styles.contentContainer, containerStyle]}>
                {/* Search & Filter Bar */}
                <View style={[styles.searchContainer, { backgroundColor: isDark ? '#1E293B' : '#fff' }]}>
                    <TouchableOpacity
                        style={styles.filterButton}
                        onPress={() => setShowFilterModal(true)}
                    >
                        <MaterialCommunityIcons
                            name="filter-variant"
                            size={24}
                            color={selectedClass !== 'All' || selectedLearnerType !== 'All' ? '#4F46E5' : (isDark ? '#94A3B8' : '#64748B')}
                        />
                        {(selectedClass !== 'All' || selectedLearnerType !== 'All') && (
                            <View style={styles.activeFilterBadge} />
                        )}
                    </TouchableOpacity>
                    <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />
                    <MaterialCommunityIcons name="magnify" size={20} color={isDark ? '#94A3B8' : '#64748B'} />
                    <TextInput
                        placeholder="Search students..."
                        placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        style={[styles.searchInput, { color: isDark ? '#fff' : '#1E293B' }]}
                    />
                </View>

                {/* Applied Filters Chips */}
                {(selectedClass !== 'All' || selectedLearnerType !== 'All') && (
                    <View style={styles.activeFiltersRow}>
                        {selectedClass !== 'All' && (
                            <TouchableOpacity onPress={() => setSelectedClass('All')} style={styles.filterChip}>
                                <Text style={styles.filterChipText}>Class: {selectedClass}</Text>
                                <MaterialCommunityIcons name="close" size={14} color="#4F46E5" />
                            </TouchableOpacity>
                        )}
                        {selectedLearnerType !== 'All' && (
                            <TouchableOpacity onPress={() => setSelectedLearnerType('All')} style={styles.filterChip}>
                                <Text style={styles.filterChipText}>{selectedLearnerType}</Text>
                                <MaterialCommunityIcons name="close" size={14} color="#4F46E5" />
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={() => { setSelectedClass('All'); setSelectedLearnerType('All'); }}>
                            <Text style={styles.clearAllText}>Clear All</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#4F46E5" />
                    </View>
                ) : (
                    <FlatList
                        data={filteredStudents}
                        renderItem={renderItem}
                        keyExtractor={(item: any) => item._id}
                        contentContainerStyle={styles.list}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View style={styles.emptyState}>
                                <LinearGradient
                                    colors={['rgba(79, 70, 229, 0.1)', 'rgba(124, 58, 237, 0.1)']}
                                    style={styles.emptyIconContainer}
                                >
                                    <MaterialCommunityIcons name="account-group-outline" size={64} color="#4F46E5" />
                                </LinearGradient>
                                <Text style={[styles.emptyText, { color: isDark ? '#fff' : '#1E293B' }]}>No students found</Text>
                                <Text style={[styles.emptySubtext, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                                    {(searchQuery || selectedClass !== 'All' || selectedLearnerType !== 'All')
                                        ? 'Try adjusting your filters'
                                        : 'Add your first student to get started'}
                                </Text>
                            </View>
                        }
                    />
                )}
            </View>

            {/* Filter Modal */}
            <Modal
                visible={showFilterModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowFilterModal(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setShowFilterModal(false)}
                >
                    <Pressable
                        style={[styles.modalContent, { backgroundColor: isDark ? '#1E293B' : '#fff' }]}
                        onPress={e => e.stopPropagation()}
                    >
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: isDark ? '#fff' : '#1E293B' }]}>Filter Students</Text>
                            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                                <MaterialCommunityIcons name="close" size={24} color={isDark ? '#94A3B8' : '#64748B'} />
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.filterSectionTitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>Class</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                            {uniqueClasses.map((cls: any) => (
                                <TouchableOpacity
                                    key={cls}
                                    style={[
                                        styles.chip,
                                        selectedClass === cls && styles.activeChip,
                                        { backgroundColor: selectedClass === cls ? '#4F46E5' : (isDark ? '#334155' : '#F1F5F9') }
                                    ]}
                                    onPress={() => setSelectedClass(cls)}
                                >
                                    <Text style={[
                                        styles.chipText,
                                        { color: selectedClass === cls ? '#fff' : (isDark ? '#fff' : '#475569') }
                                    ]}>
                                        {cls === 'All' ? 'All Classes' : `Class ${cls}`}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <Text style={[styles.filterSectionTitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>Learner Type</Text>
                        <View style={styles.chipsRow}>
                            {['All', 'Fast', 'Average', 'Slow'].map((type) => (
                                <TouchableOpacity
                                    key={type}
                                    style={[
                                        styles.chip,
                                        selectedLearnerType === type && styles.activeChip,
                                        { backgroundColor: selectedLearnerType === type ? '#4F46E5' : (isDark ? '#334155' : '#F1F5F9') }
                                    ]}
                                    onPress={() => setSelectedLearnerType(type)}
                                >
                                    <Text style={[
                                        styles.chipText,
                                        { color: selectedLearnerType === type ? '#fff' : (isDark ? '#fff' : '#475569') }
                                    ]}>{type}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.resetButton, { borderColor: isDark ? '#475569' : '#E2E8F0' }]}
                                onPress={() => {
                                    setSelectedClass('All');
                                    setSelectedLearnerType('All');
                                }}
                            >
                                <Text style={[styles.resetButtonText, { color: isDark ? '#94A3B8' : '#64748B' }]}>Reset</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.applyButton}
                                onPress={() => setShowFilterModal(false)}
                            >
                                <Text style={styles.applyButtonText}>Apply Filters</Text>
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>

            {/* Delete Confirmation Dialog */}
            <Portal>
                <Dialog
                    visible={deleteDialogVisible}
                    onDismiss={() => setDeleteDialogVisible(false)}
                    style={{
                        backgroundColor: isDark ? '#1E293B' : '#fff',
                        borderRadius: 16,
                        maxWidth: 400,
                        width: '90%',
                        alignSelf: 'center'
                    }}
                >
                    <View style={{ alignItems: 'center', marginVertical: 20 }}>
                        <View style={{
                            width: 64,
                            height: 64,
                            borderRadius: 16,
                            backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginBottom: 16
                        }}>
                            <MaterialCommunityIcons name="delete-outline" size={32} color="#EF4444" />
                        </View>
                        <Text style={{
                            fontSize: 20,
                            fontWeight: 'bold',
                            color: isDark ? '#fff' : '#1E293B',
                            marginBottom: 8
                        }}>
                            Delete Student?
                        </Text>
                        <Text style={{
                            fontSize: 14,
                            color: isDark ? '#94A3B8' : '#64748B',
                            textAlign: 'center',
                            paddingHorizontal: 24
                        }}>
                            Are you sure you want to delete "{studentToDelete?.name}"? This action cannot be undone.
                        </Text>
                    </View>
                    <Dialog.Actions style={{ paddingHorizontal: 24, paddingBottom: 24, justifyContent: 'space-between' }}>
                        <Button
                            mode="outlined"
                            onPress={() => setDeleteDialogVisible(false)}
                            style={{ flex: 1, marginRight: 8, borderRadius: 8, borderColor: isDark ? '#475569' : '#E2E8F0' }}
                            textColor={isDark ? '#CBD5E1' : '#64748B'}
                        >
                            Cancel
                        </Button>
                        <Button
                            mode="contained"
                            onPress={confirmDelete}
                            style={{ flex: 1, marginLeft: 8, borderRadius: 8, backgroundColor: '#EF4444' }}
                            textColor="#fff"
                        >
                            Delete
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </ScreenBackground >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    contentContainer: {
        flex: 1,
        width: '100%',
        alignSelf: 'center',
        padding: 20,
        paddingTop: 10,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        marginBottom: 12, // Reduced margin since chips might appear below
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    filterButton: {
        padding: 4,
        marginRight: 8,
        position: 'relative',
    },
    activeFilterBadge: {
        position: 'absolute',
        top: 4,
        right: 2,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#EF4444',
        borderWidth: 1,
        borderColor: '#fff',
    },
    divider: {
        width: 1,
        height: 24,
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: 15,
    },
    activeFiltersRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 20,
        flexWrap: 'wrap',
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 4,
        borderWidth: 1,
        borderColor: '#C7D2FE',
    },
    filterChipText: {
        fontSize: 12,
        color: '#4F46E5',
        fontWeight: '600',
    },
    clearAllText: {
        fontSize: 12,
        color: '#64748B',
        textDecorationLine: 'underline',
        marginLeft: 4,
    },
    list: {
        paddingBottom: 40,
    },
    card: {
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    cardMobile: {
        padding: 16,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    userSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        flex: 1,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    userInfo: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    email: {
        fontSize: 13,
        marginBottom: 6,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    grade: {
        fontSize: 13,
        fontWeight: '500',
    },
    badgesSection: {
        alignItems: 'flex-end',
        gap: 8,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
    },
    learnerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    learnerText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
    },
    actionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    analyticsButton: {
        flex: 1,
        backgroundColor: '#10B981',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    analyticsButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    iconButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    iconButton: {
        width: 42,
        height: 42,
        borderRadius: 12,
        overflow: 'hidden',
    },
    iconGradient: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        height: 300,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        textAlign: 'center',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        maxWidth: 400,
        padding: 24,
        borderRadius: 24,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    filterSectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
        marginTop: 4,
    },
    chipsScroll: {
        marginBottom: 24,
        maxHeight: 40,
    },
    chipsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 32,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8, // for scrollview
    },
    activeChip: {
        backgroundColor: '#4F46E5',
    },
    chipText: {
        fontSize: 14,
        fontWeight: '500',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
    },
    resetButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    resetButtonText: {
        fontSize: 15,
        fontWeight: '600',
    },
    applyButton: {
        flex: 1,
        backgroundColor: '#4F46E5',
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    applyButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
});

export default StudentListScreen;
