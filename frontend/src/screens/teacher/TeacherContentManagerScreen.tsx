import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Text, TextInput, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../services/api';

const TeacherContentManagerScreen = () => {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);

    // Chapter Details
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [selectedClass, setSelectedClass] = useState('6');
    const [subject, setSubject] = useState('Math');

    const handleSubmit = async () => {
        if (!title || !content || !subject || !selectedClass) {
            Alert.alert('Error', 'Please fill in all details');
            return;
        }

        setLoading(true);
        try {
            await api.post('/teacher/chapter', {
                title,
                content,
                classNumber: selectedClass,
                subject
            });
            Alert.alert('Success', 'Content Created Successfully', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.error('Failed to create chapter:', error);
            Alert.alert('Error', 'Failed to create chapter');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Gradient Header */}
            <LinearGradient
                colors={['#6200EA', '#7C4DFF']}
                style={styles.header}
            >
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Create Chapter</Text>
                    <Text style={styles.headerSubtitle}>Build learning content</Text>
                </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Chapter Details Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <MaterialCommunityIcons name="book-open-page-variant" size={24} color="#6200EA" />
                        <Text style={styles.cardTitle}>Chapter Details</Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Chapter Title *</Text>
                        <TextInput
                            value={title}
                            onChangeText={setTitle}
                            placeholder="Enter chapter title"
                            style={styles.textInput}
                            mode="outlined"
                            outlineColor="#E0E0E0"
                            activeOutlineColor="#6200EA"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Class *</Text>
                        <View style={styles.chipGroup}>
                            {['6', '7', '8', '9', '10'].map(c => (
                                <TouchableOpacity
                                    key={c}
                                    style={[styles.chip, selectedClass === c && styles.chipActive]}
                                    onPress={() => setSelectedClass(c)}
                                >
                                    <Text style={[styles.chipText, selectedClass === c && styles.chipTextActive]}>
                                        Class {c}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Subject *</Text>
                        <View style={styles.chipGroup}>
                            {['Math', 'Science', 'English', 'Social'].map(s => (
                                <TouchableOpacity
                                    key={s}
                                    style={[styles.chip, subject === s && styles.chipActive]}
                                    onPress={() => setSubject(s)}
                                >
                                    <Text style={[styles.chipText, subject === s && styles.chipTextActive]}>
                                        {s}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>

                {/* Content Editor Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <MaterialCommunityIcons name="text-box-edit" size={24} color="#6200EA" />
                        <Text style={styles.cardTitle}>Content</Text>
                    </View>

                    <View style={styles.markdownHint}>
                        <MaterialCommunityIcons name="information" size={16} color="#6200EA" />
                        <Text style={styles.hintText}>
                            Markdown supported: **bold**, *italic*, # headings, - lists
                        </Text>
                    </View>

                    <TextInput
                        value={content}
                        onChangeText={setContent}
                        placeholder="Write your chapter content here...&#10;&#10;Use markdown for rich formatting:&#10;# Heading 1&#10;## Heading 2&#10;**Bold text**&#10;*Italic text*&#10;- Bullet point"
                        multiline
                        numberOfLines={15}
                        style={styles.contentInput}
                        mode="outlined"
                        outlineColor="#E0E0E0"
                        activeOutlineColor="#6200EA"
                    />

                    <View style={styles.tipCard}>
                        <MaterialCommunityIcons name="lightbulb-on" size={20} color="#FFA000" />
                        <View style={styles.tipContent}>
                            <Text style={styles.tipTitle}>Pro Tip</Text>
                            <Text style={styles.tipText}>
                                Break complex topics into smaller sections using headings. Include examples and practice questions!
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                    style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    <LinearGradient
                        colors={['#6200EA', '#7C4DFF']}
                        style={styles.submitGradient}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <MaterialCommunityIcons name="check-circle" size={24} color="#fff" />
                                <Text style={styles.submitText}>Create Chapter</Text>
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F7',
    },
    header: {
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        elevation: 8,
        shadowColor: '#6200EA',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    backButton: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
    },
    headerContent: {
        marginLeft: 16,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 2,
    },
    content: {
        padding: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 12,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: 8,
    },
    textInput: {
        backgroundColor: '#fff',
    },
    chipGroup: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#F5F5F7',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    chipActive: {
        backgroundColor: '#6200EA',
        borderColor: '#6200EA',
    },
    chipText: {
        fontSize: 13,
        color: '#666',
        fontWeight: '500',
    },
    chipTextActive: {
        color: '#fff',
        fontWeight: 'bold',
    },
    markdownHint: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F0FF',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    hintText: {
        fontSize: 12,
        color: '#6200EA',
        marginLeft: 8,
        flex: 1,
    },
    contentInput: {
        backgroundColor: '#fff',
        minHeight: 250,
        textAlignVertical: 'top',
        fontFamily: 'monospace',
    },
    tipCard: {
        flexDirection: 'row',
        backgroundColor: '#FFF9E6',
        padding: 12,
        borderRadius: 8,
        marginTop: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#FFA000',
    },
    tipContent: {
        marginLeft: 12,
        flex: 1,
    },
    tipTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#F57C00',
        marginBottom: 4,
    },
    tipText: {
        fontSize: 12,
        color: '#795548',
        lineHeight: 18,
    },
    submitButton: {
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 4,
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        gap: 8,
    },
    submitText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default TeacherContentManagerScreen;
