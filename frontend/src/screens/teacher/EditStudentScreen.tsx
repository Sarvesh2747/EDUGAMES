import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../services/api';
import ScreenBackground from '../../components/ScreenBackground';
import CompactHeader from '../../components/ui/CompactHeader';
import CustomInput from '../../components/ui/CustomInput';
import CustomButton from '../../components/ui/CustomButton';
import { useAppTheme } from '../../context/ThemeContext';
import { useResponsive } from '../../hooks/useResponsive';
import Animated, { FadeInDown } from 'react-native-reanimated';
import SuccessModal from '../../components/ui/SuccessModal';

const EditStudentScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { student }: any = route.params;
    const { isDark } = useAppTheme();
    const { isDesktop, maxContentWidth } = useResponsive();

    const [name, setName] = useState(student.name);
    const [rollNo, setRollNo] = useState(student.rollNo);
    const [status, setStatus] = useState(student.status || 'active');
    const [loading, setLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const handleUpdate = async () => {
        if (!name || !rollNo) {
            // Simple alert for validation is fine, but prefer consistent UI if possible.
            // Sticking to simple alert for blocking validation to avoid complex UI state for now, 
            // or replace with a Toast in future.
            alert('Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            await api.put(`/teacher/student/${student._id}`, {
                name,
                rollNo,
                status
            });
            setShowSuccessModal(true);
        } catch (error: any) {
            console.error('Update error:', error);
            alert(error.response?.data?.message || 'Failed to update student');
        } finally {
            setLoading(false);
        }
    };

    const styles = createStyles(isDark, isDesktop);

    return (
        <ScreenBackground>
            <CompactHeader
                title="Edit Student"
                subtitle="Update student details"
                onBack={() => navigation.goBack()}
            />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Animated.View
                    entering={FadeInDown.delay(100).springify()}
                    style={[styles.container, isDesktop && { maxWidth: maxContentWidth, alignSelf: 'center', width: '100%' }]}
                >
                    <Surface style={[styles.card, { backgroundColor: isDark ? '#1E293B' : '#fff' }]}>
                        <View style={styles.avatarContainer}>
                            <View style={[styles.avatarPlaceholder, { backgroundColor: isDark ? '#334155' : '#E0E7FF' }]}>
                                <Text style={[styles.avatarText, { color: '#4F46E5' }]}>
                                    {name.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                        </View>

                        <CustomInput
                            label="Full Name"
                            value={name}
                            onChangeText={setName}
                            placeholder="Enter student name"
                            icon="account"
                        />
                        <View style={{ height: 16 }} />
                        <CustomInput
                            label="Roll Number"
                            value={rollNo}
                            onChangeText={setRollNo}
                            placeholder="Enter roll number"
                            icon="card-account-details"
                        />

                        <View style={styles.statusSection}>
                            <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#4B5563' }]}>Status</Text>
                            <View style={styles.statusOptions}>
                                <TouchableOpacity
                                    style={[
                                        styles.statusChip,
                                        status === 'active' && styles.statusActive,
                                        isDark && status !== 'active' && { borderColor: '#475569' }
                                    ]}
                                    onPress={() => setStatus('active')}
                                >
                                    <Text style={[
                                        styles.statusText,
                                        status === 'active' && styles.statusTextActive,
                                        isDark && status !== 'active' && { color: '#94A3B8' }
                                    ]}>
                                        Active
                                    </Text>
                                    {status === 'active' && <MaterialCommunityIcons name="check" size={16} color="#fff" />}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.statusChip,
                                        status === 'inactive' && styles.statusInactive,
                                        isDark && status !== 'inactive' && { borderColor: '#475569' }
                                    ]}
                                    onPress={() => setStatus('inactive')}
                                >
                                    <Text style={[
                                        styles.statusText,
                                        status === 'inactive' && styles.statusTextActive,
                                        isDark && status !== 'inactive' && { color: '#94A3B8' }
                                    ]}>
                                        Inactive
                                    </Text>
                                    {status === 'inactive' && <MaterialCommunityIcons name="check" size={16} color="#fff" />}
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={{ height: 32 }} />

                        <CustomButton
                            onPress={handleUpdate}
                            loading={loading}
                        >
                            Update Student
                        </CustomButton>
                    </Surface>
                </Animated.View>
            </ScrollView>

            <SuccessModal
                visible={showSuccessModal}
                title="Student Updated"
                message="Student details have been updated successfully."
                onClose={() => {
                    setShowSuccessModal(false);
                    navigation.goBack();
                }}
                buttonText="Go Back"
            />
        </ScreenBackground>
    );
};

const createStyles = (isDark: boolean, isDesktop: boolean) => StyleSheet.create({
    scrollContent: {
        paddingTop: 20,
        paddingBottom: 40,
    },
    container: {
        paddingHorizontal: 20,
    },
    card: {
        padding: 24,
        borderRadius: 24,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: isDark ? '#1E293B' : '#fff',
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
    },
    avatarText: {
        fontSize: 40,
        fontWeight: 'bold',
    },
    statusSection: {
        marginTop: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
        marginLeft: 4,
    },
    statusOptions: {
        flexDirection: 'row',
        gap: 12,
    },
    statusChip: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        gap: 8,
    },
    statusActive: {
        backgroundColor: '#10B981',
        borderColor: '#10B981',
    },
    statusInactive: {
        backgroundColor: '#EF4444',
        borderColor: '#EF4444',
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
    },
    statusTextActive: {
        color: '#fff',
    },
});

export default EditStudentScreen;
