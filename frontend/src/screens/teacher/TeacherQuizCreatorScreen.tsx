import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { Text, TextInput, RadioButton, ActivityIndicator, Surface } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../services/api';
import SuccessModal from '../../components/ui/SuccessModal';
import { useAppTheme } from '../../context/ThemeContext';
import { spacing } from '../../theme';
import Animated, { FadeInDown } from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const isDesktop = width >= 768;

const TeacherQuizCreatorScreen = () => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { isDark } = useAppTheme();
    const [loading, setLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

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
                setSuccessMessage('Quiz updated successfully!');
                setShowSuccessModal(true);
            } else {
                await api.post('/teacher/quiz', {
                    title,
                    description,
                    classNumber: selectedClass,
                    subject,
                    questions
                });
                setSuccessMessage('Quiz Created Successfully!');
                setShowSuccessModal(true);
            }
        } catch (error) {
            console.error('Failed to save quiz:', error);
            Alert.alert('Error', 'Failed to save quiz');
        } finally {
            setLoading(false);
        }
    };

    const handleSuccessClose = () => {
        setShowSuccessModal(false);
        navigation.goBack();
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

            <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <LinearGradient
                    colors={['#6366F1', '#8B5CF6', '#A855F7']} // Premium Purple Gradient
                    style={[styles.header, { paddingTop: insets.top + 20 }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <View style={styles.headerContentWrapper}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
                        </TouchableOpacity>
                        <View style={styles.headerTextContainer}>
                            <Text style={styles.headerTitle}>{isEditing ? 'Edit Quiz' : 'Create Quiz'}</Text>
                            <Text style={styles.headerSubtitle}>Design your assessment</Text>
                        </View>
                        <View style={{ width: 40 }} />
                    </View>
                </LinearGradient>

                {/* Main Content (Centered on Desktop) */}
                <View style={styles.contentContainer}>
                    <Animated.View entering={FadeInDown.delay(100).springify()}>
                        {/* Quiz Details Card */}
                        <View style={[styles.card, { backgroundColor: isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)' }]}>
                            <View style={styles.cardHeader}>
                                <View style={styles.iconContainer}>
                                    <MaterialCommunityIcons name="clipboard-text" size={24} color="#fff" />
                                </View>
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
                                    outlineColor="rgba(0,0,0,0.1)"
                                    activeOutlineColor="#6366F1"
                                    textColor="#1F2937"
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
                                    outlineColor="rgba(0,0,0,0.1)"
                                    activeOutlineColor="#6366F1"
                                    textColor="#1F2937"
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
                    </Animated.View>

                    {/* Questions Section */}
                    <View style={styles.sectionHeader}>
                        <MaterialCommunityIcons name="help-circle-outline" size={24} color="#333" />
                        <Text style={styles.sectionTitle}>Questions ({questions.length})</Text>
                    </View>

                    {questions.map((q: any, qIndex: number) => (
                        <Animated.View entering={FadeInDown.delay(200 + (qIndex * 100)).springify()} key={qIndex} style={styles.questionCard}>
                            <View style={styles.questionHeader}>
                                <LinearGradient
                                    colors={['#6366F1', '#8B5CF6']}
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
                                    outlineColor="rgba(0,0,0,0.1)"
                                    activeOutlineColor="#6366F1"
                                    textColor="#1F2937"
                                />
                            </View>

                            <Text style={styles.label}>Options *</Text>
                            {q.options.map((opt: string, oIndex: number) => (
                                <View key={oIndex} style={styles.optionRow}>
                                    <RadioButton.Android
                                        value={oIndex.toString()}
                                        status={q.correctIndex === oIndex ? 'checked' : 'unchecked'}
                                        onPress={() => updateQuestion(qIndex, 'correctIndex', oIndex)}
                                        color="#6366F1"
                                    />
                                    <TextInput
                                        value={opt}
                                        onChangeText={(text) => updateOption(qIndex, oIndex, text)}
                                        placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                                        style={[styles.textInput, styles.optionInput]}
                                        mode="outlined"
                                        outlineColor="rgba(0,0,0,0.1)"
                                        activeOutlineColor="#6366F1"
                                        textColor="#1F2937"
                                    />
                                    {q.correctIndex === oIndex && (
                                        <MaterialCommunityIcons name="check-circle" size={20} color="#10B981" style={styles.correctIcon} />
                                    )}
                                </View>
                            ))}
                        </Animated.View>
                    ))}

                    {/* Add Question Button */}
                    <TouchableOpacity
                        style={styles.addQuestionButton}
                        onPress={handleAddQuestion}
                    >
                        <MaterialCommunityIcons name="plus-circle" size={24} color="#6366F1" />
                        <Text style={styles.addQuestionText}>Add Another Question</Text>
                    </TouchableOpacity>

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        <LinearGradient
                            colors={['#6366F1', '#8B5CF6']}
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
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            <SuccessModal
                visible={showSuccessModal}
                title="Success!"
                message={successMessage}
                onClose={handleSuccessClose}
                buttonText="Back to Dashboard"
            />
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
    header: {
        paddingBottom: 40,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        paddingHorizontal: spacing.lg,
        elevation: 8,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    headerContentWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTextContainer: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        marginTop: 2,
    },
    contentContainer: {
        padding: spacing.lg,
        marginTop: -30, // Overlap effect
        maxWidth: 800, // Center on desktop
        width: '100%',
        alignSelf: 'center',
    },
    card: {
        borderRadius: 24,
        padding: 24,
        marginBottom: spacing.lg,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#6366F1',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4B5563',
        marginBottom: 8,
    },
    textInput: {
        backgroundColor: '#fff',
        fontSize: 16,
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
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    chipActive: {
        backgroundColor: '#6366F1',
        borderColor: '#6366F1',
    },
    chipText: {
        fontSize: 14,
        color: '#6B7280',
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
        color: '#1F2937',
        marginLeft: 12,
    },
    questionCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        marginBottom: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    questionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    questionBadge: {
        paddingHorizontal: 16,
        paddingVertical: 6,
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
        gap: 6,
        padding: 8,
        backgroundColor: '#FEE2E2',
        borderRadius: 12,
    },
    deleteText: {
        color: '#EF4444',
        fontSize: 13,
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
        marginLeft: 12,
    },
    addQuestionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#6366F1',
        borderStyle: 'dashed',
        marginBottom: 24,
    },
    addQuestionText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#6366F1',
        marginLeft: 10,
    },
    submitButton: {
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
        gap: 10,
    },
    submitText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
});

export default TeacherQuizCreatorScreen;
