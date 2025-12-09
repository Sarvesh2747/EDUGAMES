import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Dimensions } from 'react-native';
import { Text, TextInput, RadioButton, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../services/api';

const { width } = Dimensions.get('window');

const TeacherQuizCreatorScreen = () => {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);

    const routes = navigation.getState()?.routes;
    const quizCreatorRoute = routes?.find((r: any) => r.name === 'TeacherQuizCreator');
    const { quizToEdit } = (quizCreatorRoute?.params as any) || {};
    const isEditing = !!quizToEdit;

    // Quiz Details
    const [title, setTitle] = useState(quizToEdit?.title || '');
    const [description, setDescription] = useState(quizToEdit?.description || '');
    const [selectedClass, setSelectedClass] = useState(quizToEdit?.classNumber || '6');
    const [subject, setSubject] = useState(quizToEdit?.subject || 'Math');

    // Questions
    const [questions, setQuestions] = useState(quizToEdit?.questions || [
        { question: '', options: ['', '', '', ''], correctIndex: 0 }
    ]);

    const handleAddQuestion = () => {
        setQuestions([...questions, { question: '', options: ['', '', '', ''], correctIndex: 0 }]);
    };

    const handleRemoveQuestion = (index: number) => {
        const newQuestions = [...questions];
        newQuestions.splice(index, 1);
        setQuestions(newQuestions);
    };

    const updateQuestion = (index: number, field: string, value: any) => {
        const newQuestions = [...questions];
        // @ts-ignore
        newQuestions[index][field] = value;
        setQuestions(newQuestions);
    };

    const updateOption = (qIndex: number, oIndex: number, value: string) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].options[oIndex] = value;
        setQuestions(newQuestions);
    };

    const handleSubmit = async () => {
        if (!title || !subject || !selectedClass) {
            Alert.alert('Error', 'Please fill in all quiz details');
            return;
        }

        // Validate questions
        for (let i = 0; i < questions.length; i++) {
            if (!questions[i].question) {
                Alert.alert('Error', `Question ${i + 1} is missing text`);
                return;
            }
            if (questions[i].options.some((opt: string) => !opt)) {
                Alert.alert('Error', `Question ${i + 1} has empty options`);
                return;
            }
        }

        setLoading(true);
        try {
            if (isEditing) {
                await api.put(`/teacher/quiz/${quizToEdit._id}`, {
                    title,
                    description,
                    classNumber: selectedClass,
                    subject,
                    questions
                });
                Alert.alert('Success', 'Quiz updated successfully!', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            } else {
                await api.post('/teacher/quiz', {
                    title,
                    description,
                    classNumber: selectedClass,
                    subject,
                    questions
                });
                Alert.alert('Success', 'Quiz Created Successfully', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            }
        } catch (error) {
            console.error('Failed to save quiz:', error);
            Alert.alert('Error', 'Failed to save quiz');
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
                    <Text style={styles.headerTitle}>{isEditing ? 'Edit Quiz' : 'Create Quiz'}</Text>
                    <Text style={styles.headerSubtitle}>Design your assessment</Text>
                </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Quiz Details Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <MaterialCommunityIcons name="clipboard-text" size={24} color="#6200EA" />
                        <Text style={styles.cardTitle}>Quiz Details</Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Quiz Title *</Text>
                        <TextInput
                            value={title}
                            onChangeText={setTitle}
                            placeholder="Enter quiz title"
                            style={styles.textInput}
                            mode="outlined"
                            outlineColor="#E0E0E0"
                            activeOutlineColor="#6200EA"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Description (Optional)</Text>
                        <TextInput
                            value={description}
                            onChangeText={setDescription}
                            placeholder="Brief description of the quiz"
                            multiline
                            numberOfLines={3}
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

                {/* Questions Section */}
                <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons name="help-circle" size={24} color="#333" />
                    <Text style={styles.sectionTitle}>Questions ({questions.length})</Text>
                </View>

                {questions.map((q: any, qIndex: number) => (
                    <View key={qIndex} style={styles.questionCard}>
                        <View style={styles.questionHeader}>
                            <LinearGradient
                                colors={['#6200EA', '#7C4DFF']}
                                style={styles.questionBadge}
                            >
                                <Text style={styles.questionNumber}>Q{qIndex + 1}</Text>
                            </LinearGradient>
                            {questions.length > 1 && (
                                <TouchableOpacity
                                    onPress={() => handleRemoveQuestion(qIndex)}
                                    style={styles.deleteButton}
                                >
                                    <MaterialCommunityIcons name="delete-outline" size={20} color="#EF4444" />
                                    <Text style={styles.deleteText}>Remove</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Question Text *</Text>
                            <TextInput
                                value={q.question}
                                onChangeText={(text) => updateQuestion(qIndex, 'question', text)}
                                placeholder="Enter your question"
                                multiline
                                mode="outlined"
                                style={styles.textInput}
                                outlineColor="#E0E0E0"
                                activeOutlineColor="#6200EA"
                            />
                        </View>

                        <Text style={styles.label}>Options *</Text>
                        {q.options.map((opt: string, oIndex: number) => (
                            <View key={oIndex} style={styles.optionRow}>
                                <RadioButton
                                    value={oIndex.toString()}
                                    status={q.correctIndex === oIndex ? 'checked' : 'unchecked'}
                                    onPress={() => updateQuestion(qIndex, 'correctIndex', oIndex)}
                                    color="#6200EA"
                                />
                                <TextInput
                                    value={opt}
                                    onChangeText={(text) => updateOption(qIndex, oIndex, text)}
                                    placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                                    style={[styles.textInput, styles.optionInput]}
                                    mode="outlined"
                                    outlineColor="#E0E0E0"
                                    activeOutlineColor="#6200EA"
                                />
                                {q.correctIndex === oIndex && (
                                    <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" style={styles.correctIcon} />
                                )}
                            </View>
                        ))}
                    </View>
                ))}

                {/* Add Question Button */}
                <TouchableOpacity
                    style={styles.addQuestionButton}
                    onPress={handleAddQuestion}
                >
                    <MaterialCommunityIcons name="plus-circle" size={24} color="#6200EA" />
                    <Text style={styles.addQuestionText}>Add Another Question</Text>
                </TouchableOpacity>

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
                                <Text style={styles.submitText}>
                                    {isEditing ? 'Update Quiz' : 'Create Quiz'}
                                </Text>
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
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        marginTop: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 12,
    },
    questionCard: {
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
    questionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    questionBadge: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    questionNumber: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        padding: 8,
    },
    deleteText: {
        color: '#EF4444',
        fontSize: 14,
        fontWeight: '600',
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    optionInput: {
        flex: 1,
        marginBottom: 0,
    },
    correctIcon: {
        marginLeft: 8,
    },
    addQuestionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#6200EA',
        borderStyle: 'dashed',
        marginBottom: 16,
    },
    addQuestionText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6200EA',
        marginLeft: 8,
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

export default TeacherQuizCreatorScreen;
