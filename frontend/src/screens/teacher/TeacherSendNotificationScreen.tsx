
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { Text, TextInput, Surface, ActivityIndicator, HelperText } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import api from '../../services/api';
import GradientBackground from '../../components/ui/GradientBackground';
import CustomButton from '../../components/ui/CustomButton';
import { spacing, borderRadius, theme } from '../../theme';
import { Ionicons } from '@expo/vector-icons';

const TeacherSendNotificationScreen = () => {
    const navigation = useNavigation();
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    // Form state
    const [selectedStudent, setSelectedStudent] = useState('');
    const [sendToAll, setSendToAll] = useState(false); // New state
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [notificationType, setNotificationType] = useState('assignment');

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const response = await api.get('/teacher/students');
            setStudents(response.data);
        } catch (error) {
            console.error('Failed to fetch students:', error);
            Alert.alert('Error', 'Failed to load students list');
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if ((!selectedStudent && !sendToAll) || !title.trim() || !message.trim()) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setSending(true);
        try {
            await api.post('/notifications/send', {
                recipientId: sendToAll ? 'all' : selectedStudent,
                title,
                message,
                type: notificationType,
                data: {}
            });

            Alert.alert('Success', 'Notification Created Successfully', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error: any) {
            console.error('Failed to send notification:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to send notification');
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#fff" />
            </View>
        );
    }

    return (
        <GradientBackground>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <View style={styles.header}>
                    <CustomButton
                        variant="text"
                        icon="arrow-left"
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                    >
                        {""}
                    </CustomButton>
                    <Text style={styles.headerTitle}>Send Notification</Text>
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    <Surface style={styles.formCard}>
                        <View style={styles.fieldContainer}>
                            <View style={styles.switchRow}>
                                <Text style={styles.label}>Send to All Students</Text>
                                <Switch
                                    value={sendToAll}
                                    onValueChange={setSendToAll}
                                    trackColor={{ false: '#767577', true: '#81b0ff' }}
                                    thumbColor={sendToAll ? '#4c669f' : '#f4f3f4'}
                                />
                            </View>

                            {!sendToAll && (
                                <>
                                    <Text style={styles.label}>Select Student</Text>
                                    <View style={styles.pickerContainer}>
                                        <Picker
                                            selectedValue={selectedStudent}
                                            onValueChange={(itemValue) => setSelectedStudent(itemValue)}
                                            style={styles.picker}
                                        >
                                            <Picker.Item label="Select a student..." value="" />
                                            {students.map((student) => (
                                                <Picker.Item
                                                    key={student._id}
                                                    label={student.name}
                                                    value={student._id}
                                                />
                                            ))}
                                        </Picker>
                                    </View>
                                </>
                            )}
                        </View>

                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>Notification Type</Text>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={notificationType}
                                    onValueChange={(itemValue) => setNotificationType(itemValue)}
                                    style={styles.picker}
                                >
                                    <Picker.Item label="Assignment" value="assignment" />
                                    <Picker.Item label="Approval" value="approval" />
                                    <Picker.Item label="Reminder" value="reminder" />
                                    <Picker.Item label="General" value="system" />
                                </Picker>
                            </View>
                        </View>

                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>Title</Text>
                            <TextInput
                                mode="outlined"
                                value={title}
                                onChangeText={setTitle}
                                placeholder="Enter notification title"
                                style={styles.input}
                            />
                        </View>

                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>Message</Text>
                            <TextInput
                                mode="outlined"
                                value={message}
                                onChangeText={setMessage}
                                placeholder="Enter your message"
                                multiline
                                numberOfLines={4}
                                style={styles.input}
                            />
                        </View>

                        <CustomButton
                            variant="primary"
                            onPress={handleSend}
                            loading={sending}
                            style={styles.sendButton}
                            icon="send"
                        >
                            Send Notification
                        </CustomButton>
                    </Surface>
                </ScrollView>
            </KeyboardAvoidingView>
        </GradientBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#4c669f',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 50,
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.md,
    },
    backButton: {
        marginRight: spacing.sm,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    content: {
        padding: spacing.lg,
    },
    formCard: {
        padding: spacing.lg,
        borderRadius: borderRadius.xl,
        backgroundColor: '#fff',
        elevation: 4,
    },
    fieldContainer: {
        marginBottom: spacing.lg,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: spacing.xs,
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: borderRadius.md,
        backgroundColor: '#f9f9f9',
    },
    picker: {
        height: 50,
    },
    input: {
        backgroundColor: '#fff',
    },
    sendButton: {
        marginTop: spacing.md,
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
        paddingHorizontal: spacing.sm,
    },
});

export default TeacherSendNotificationScreen;
