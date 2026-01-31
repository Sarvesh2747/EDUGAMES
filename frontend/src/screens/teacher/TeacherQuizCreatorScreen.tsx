import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Text, TextInput, RadioButton, ActivityIndicator, Surface, FAB, Portal, Dialog, Paragraph, Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../services/api';
import SuccessModal from '../../components/ui/SuccessModal';
import ScreenBackground from '../../components/ScreenBackground';
import CompactHeader from '../../components/ui/CompactHeader';
import { useAppTheme } from '../../context/ThemeContext';
import { useResponsive } from '../../hooks/useResponsive';
import Animated, { FadeInDown } from 'react-native-reanimated';

const TeacherQuizCreatorScreen = () => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { isDark, theme } = useAppTheme();
    const { isDesktop, maxContentWidth } = useResponsive();

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

    // AI Gen State
    const [showAIDialog, setShowAIDialog] = useState(false);
    const [aiTopic, setAiTopic] = useState('');
    const [aiNumQuestions, setAiNumQuestions] = useState('5');
    const [aiDifficulty, setAiDifficulty] = useState('Medium');
    const [generating, setGenerating] = useState(false);

    // Alert State
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertTitle, setAlertTitle] = useState('');
    const [alertMessage, setAlertMessage] = useState('');

    const showAlert = (title: string, message: string) => {
        setAlertTitle(title);
        setAlertMessage(message);
        setAlertVisible(true);
    };

    // Questions
    const [questions, setQuestions] = useState(quizToEdit?.questions || [
        { question: '', options: ['', '', '', ''], correctIndex: 0 }
    ]);

    const handleAIGenerate = async () => {
        if (!aiTopic) {
            showAlert('Error', 'Please enter a topic');
            return;
        }

        setShowAIDialog(false);
        setGenerating(true);

        try {
            const res = await api.post('/quizzes/generate-ai', {
                topic: aiTopic,
                classLevel: selectedClass,
                difficulty: aiDifficulty,
                numQuestions: parseInt(aiNumQuestions) || 5
            });

            if (Array.isArray(res.data) && res.data.length > 0) {
                setQuestions(res.data);
                showAlert('Success', `Generated ${res.data.length} questions! Review and edit them below.`);
                // Do NOT show SuccessModal here, as it triggers navigation.goBack()
            } else {
                showAlert('Error', 'AI returned no questions. Try a different topic.');
            }
        } catch (error) {
            console.error('AI Quiz Gen Failed:', error);
            showAlert('Error', 'Failed to generate quiz');
        } finally {
            setGenerating(false);
        }
    };

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
            showAlert('Error', 'Please fill in all quiz details');
            return;
        }

        // Validate questions
        for (let i = 0; i < questions.length; i++) {
            if (!questions[i].question) {
                showAlert('Error', `Question ${i + 1} is missing text`);
                return;
            }
            if (questions[i].options.some((opt: string) => !opt)) {
                showAlert('Error', `Question ${i + 1} has empty options`);
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
            showAlert('Error', 'Failed to save quiz');
        } finally {
            setLoading(false);
        }
    };

    const handleSuccessClose = () => {
        setShowSuccessModal(false);
        navigation.goBack();
    };

    return (
        <ScreenBackground>
            <CompactHeader
                title={isEditing ? 'Edit Quiz' : 'Create Quiz'}
                subtitle="Form Builder"
                onBack={() => navigation.goBack()}
            />

            <ScrollView
                contentContainerStyle={[styles.scrollContent, isDesktop && { maxWidth: 900, alignSelf: 'center', width: '100%' }]}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.contentContainer}>
                    <Animated.View entering={FadeInDown.delay(100).springify()}>
                        {/* Top Form Header / Title Section */}
                        <Surface style={[styles.formHeaderCard, { backgroundColor: isDark ? '#1E293B' : '#fff', borderTopColor: '#4F46E5' }]}>
                            <TextInput
                                value={title}
                                onChangeText={setTitle}
                                placeholder="Untitled Quiz"
                                style={[styles.formTitleInput, { color: isDark ? '#fff' : '#1F2937' }]}
                                placeholderTextColor={isDark ? '#94A3B8' : '#9CA3AF'}
                                multiline
                            />
                            <TextInput
                                value={description}
                                onChangeText={setDescription}
                                placeholder="Form description"
                                multiline
                                style={[styles.formDescInput, { color: isDark ? '#CBD5E1' : '#6B7280' }]}
                                placeholderTextColor={isDark ? '#94A3B8' : '#9CA3AF'}
                            />

                            {/* Class & Subject Tags */}
                            <View style={styles.metaContainer}>
                                <View style={styles.metaRow}>
                                    <Text style={[styles.metaLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>Class:</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
                                        {['6', '7', '8', '9', '10'].map(c => (
                                            <TouchableOpacity
                                                key={c}
                                                style={[
                                                    styles.chip,
                                                    selectedClass === c && styles.chipActive,
                                                    { borderColor: isDark ? '#475569' : '#E2E8F0', backgroundColor: selectedClass === c ? '#4F46E5' : 'transparent' }
                                                ]}
                                                onPress={() => setSelectedClass(c)}
                                            >
                                                <Text style={[styles.chipText, selectedClass === c && { color: '#fff' }, { color: selectedClass === c ? '#fff' : (isDark ? '#CBD5E1' : '#64748B') }]}>
                                                    {c}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>

                                <View style={styles.metaRow}>
                                    <Text style={[styles.metaLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>Subject:</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
                                        {['Math', 'Science', 'English', 'Social'].map(s => (
                                            <TouchableOpacity
                                                key={s}
                                                style={[
                                                    styles.chip,
                                                    subject === s && styles.chipActive,
                                                    { borderColor: isDark ? '#475569' : '#E2E8F0', backgroundColor: subject === s ? '#4F46E5' : 'transparent' }
                                                ]}
                                                onPress={() => setSubject(s)}
                                            >
                                                <Text style={[styles.chipText, subject === s && { color: '#fff' }, { color: subject === s ? '#fff' : (isDark ? '#CBD5E1' : '#64748B') }]}>
                                                    {s}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: isDark ? '#334155' : '#F1F5F9',
                                    padding: 12,
                                    borderRadius: 8,
                                    marginTop: 16
                                }}
                                onPress={() => {
                                    setAiTopic(title || (subject ? `${subject} for Class ${selectedClass}` : ''));
                                    setShowAIDialog(true);
                                }}
                            >
                                <MaterialCommunityIcons name="magic-staff" size={20} color="#4F46E5" style={{ marginRight: 8 }} />
                                <Text style={{ color: '#4F46E5', fontWeight: '600' }}>Auto-Generate with AI</Text>
                            </TouchableOpacity>
                        </Surface>
                    </Animated.View>

                    {/* Questions List */}
                    {questions.map((q: any, qIndex: number) => (
                        <Animated.View
                            entering={FadeInDown.delay(200 + (qIndex * 100)).duration(400)}
                            key={qIndex}
                            style={[styles.questionBlock, { backgroundColor: isDark ? '#1E293B' : '#fff' }]}
                        >
                            <View style={styles.dragHandle} />

                            <View style={styles.questionHeader}>
                                <TextInput
                                    value={q.question}
                                    onChangeText={(text) => updateQuestion(qIndex, 'question', text)}
                                    placeholder="Question"
                                    multiline
                                    style={[styles.questionInput, { backgroundColor: isDark ? '#334155' : '#F8FAFC', color: isDark ? '#fff' : '#1F2937' }]}
                                    placeholderTextColor={isDark ? '#94A3B8' : '#9CA3AF'}
                                />
                                {questions.length > 1 && (
                                    <TouchableOpacity onPress={() => handleRemoveQuestion(qIndex)} style={styles.deleteBtn}>
                                        <MaterialCommunityIcons name="delete-outline" size={24} color={isDark ? '#94A3B8' : '#64748B'} />
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* Options */}
                            <View style={styles.optionsContainer}>
                                {q.options.map((opt: string, oIndex: number) => (
                                    <View key={oIndex} style={styles.optionRow}>
                                        <RadioButton.Android
                                            value={oIndex.toString()}
                                            status={q.correctIndex === oIndex ? 'checked' : 'unchecked'}
                                            onPress={() => updateQuestion(qIndex, 'correctIndex', oIndex)}
                                            color="#4F46E5"
                                            uncheckedColor={isDark ? '#94A3B8' : '#CBD5E1'}
                                        />
                                        <TextInput
                                            value={opt}
                                            onChangeText={(text) => updateOption(qIndex, oIndex, text)}
                                            placeholder={`Option ${oIndex + 1}`}
                                            style={[styles.optionInput, { color: isDark ? '#E2E8F0' : '#4B5563' }]}
                                            placeholderTextColor={isDark ? '#64748B' : '#9CA3AF'}
                                        />
                                        {q.correctIndex === oIndex && (
                                            <MaterialCommunityIcons name="check" size={18} color="#10B981" />
                                        )}
                                    </View>
                                ))}
                            </View>
                        </Animated.View>
                    ))}

                    {/* Add Question Button Block */}
                    <TouchableOpacity
                        style={[styles.addBlock, { borderColor: isDark ? '#475569' : '#E2E8F0', backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#fff' }]}
                        onPress={handleAddQuestion}
                    >
                        <MaterialCommunityIcons name="plus-circle-outline" size={28} color="#4F46E5" />
                        <Text style={[styles.addBlockText, { color: isDark ? '#CBD5E1' : '#4B5563' }]}>Add Question</Text>
                    </TouchableOpacity>

                </View>
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Floating Action / Submit Bar */}
            <View style={[styles.bottomBar, { backgroundColor: isDark ? '#1E293B' : '#fff', borderTopColor: isDark ? '#334155' : '#E2E8F0' }]}>
                <View style={[styles.bottomBarContent, isDesktop && { maxWidth: 900, width: '100%', alignSelf: 'center' }]}>
                    <Text style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 13 }}>
                        {questions.length} Question{questions.length !== 1 ? 's' : ''}
                    </Text>
                    <TouchableOpacity
                        style={[styles.saveButton, loading && { opacity: 0.7 }]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveButtonText}>Save Quiz</Text>}
                    </TouchableOpacity>
                </View>
            </View>

            <SuccessModal
                visible={showSuccessModal}
                title="Success!"
                message={successMessage}
                onClose={handleSuccessClose}
                buttonText="Back to Dashboard"
            />

            {/* AI CONFIG DIALOG */}
            <Surface style={[
                StyleSheet.absoluteFill,
                { backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
                !showAIDialog && { display: 'none' }
            ]}>
                <Surface style={{ width: '90%', maxWidth: 400, borderRadius: 16, padding: 24, backgroundColor: isDark ? '#1E293B' : '#fff' }}>
                    <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: isDark ? '#fff' : '#1F2937', textAlign: 'center' }}>
                        Generate Quiz with AI
                    </Text>

                    <TextInput
                        label="Topic"
                        value={aiTopic}
                        onChangeText={setAiTopic}
                        mode="outlined"
                        style={{ marginBottom: 16, backgroundColor: isDark ? '#334155' : '#fff' }}
                        textColor={isDark ? '#fff' : '#000'}
                    />

                    <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                        <TextInput
                            label="Questions"
                            value={aiNumQuestions}
                            onChangeText={setAiNumQuestions}
                            keyboardType="numeric"
                            mode="outlined"
                            style={{ flex: 1, backgroundColor: isDark ? '#334155' : '#fff' }}
                            textColor={isDark ? '#fff' : '#000'}
                        />
                        <View style={{ flex: 1 }}>
                            {/* Simple Difficulty Toggle for now */}
                            <Text style={{ marginBottom: 4, color: isDark ? '#CBD5E1' : '#64748B', fontSize: 12 }}>Difficulty</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                {['Easy', 'Medium', 'Hard'].map(d => (
                                    <TouchableOpacity
                                        key={d}
                                        onPress={() => setAiDifficulty(d)}
                                        style={{
                                            padding: 8,
                                            backgroundColor: aiDifficulty === d ? '#4F46E5' : (isDark ? '#334155' : '#F1F5F9'),
                                            borderRadius: 6,
                                            marginRight: 4
                                        }}
                                    >
                                        <Text style={{ color: aiDifficulty === d ? '#fff' : (isDark ? '#CBD5E1' : '#64748B'), fontSize: 12 }}>{d}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
                        <TouchableOpacity onPress={() => setShowAIDialog(false)} style={{ padding: 10 }}>
                            <Text style={{ color: isDark ? '#CBD5E1' : '#64748B' }}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleAIGenerate}
                            style={{ backgroundColor: '#4F46E5', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 }}
                        >
                            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Generate</Text>
                        </TouchableOpacity>
                    </View>
                </Surface>
            </Surface>

            {/* Loading Overlay */}
            {
                generating && (
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', zIndex: 110 }]}>
                        <ActivityIndicator size="large" color="#4F46E5" />
                        <Text style={{ color: '#fff', marginTop: 16, fontWeight: 'bold' }}>Generating Quiz...</Text>
                    </View>
                )
            }

            {/* ALERT DIALOG */}
            <Portal>
                <Dialog visible={alertVisible} onDismiss={() => setAlertVisible(false)} style={{ backgroundColor: isDark ? '#1E293B' : '#fff', borderRadius: 16, maxWidth: 400, width: '100%', alignSelf: 'center' }}>
                    <Dialog.Icon icon={alertTitle === 'Success' ? 'check-circle-outline' : 'alert-circle-outline'} color={alertTitle === 'Success' ? '#10B981' : '#F59E0B'} size={40} />
                    <Dialog.Title style={{ textAlign: 'center', color: isDark ? '#fff' : '#1E293B' }}>{alertTitle}</Dialog.Title>
                    <Dialog.Content>
                        <Paragraph style={{ textAlign: 'center', color: isDark ? '#CBD5E1' : '#475569' }}>
                            {alertMessage}
                        </Paragraph>
                    </Dialog.Content>
                    <Dialog.Actions style={{ justifyContent: 'center', paddingBottom: 24 }}>
                        <Button
                            mode="contained"
                            onPress={() => setAlertVisible(false)}
                            buttonColor="#4F46E5"
                            style={{ minWidth: 100 }}
                        >
                            OK
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>

        </ScreenBackground >
    );
};

const styles = StyleSheet.create({
    scrollContent: {
        paddingTop: 20,
    },
    contentContainer: {
        paddingHorizontal: 16,
        gap: 16,
    },
    formHeaderCard: {
        borderRadius: 12,
        padding: 24,
        borderTopWidth: 8, // Highlight strip like Google Forms
        elevation: 2,
        marginBottom: 10,
    },
    formTitleInput: {
        fontSize: 32,
        fontWeight: '400',
        backgroundColor: 'transparent',
        marginBottom: 8,
        padding: 0,
    },
    formDescInput: {
        fontSize: 15,
        backgroundColor: 'transparent',
        marginBottom: 20,
        padding: 0,
    },
    metaContainer: {
        gap: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    metaLabel: {
        width: 60,
        fontSize: 14,
        fontWeight: '600',
    },
    chipScroll: {
        gap: 8,
    },
    chip: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
    },
    chipActive: {
        backgroundColor: '#4F46E5',
        borderColor: '#4F46E5',
    },
    chipText: {
        fontSize: 13,
        fontWeight: '500',
    },
    // Question Blocks
    questionBlock: {
        borderRadius: 12,
        padding: 16,
        paddingTop: 24,
        elevation: 2,
        position: 'relative',
    },
    dragHandle: {
        position: 'absolute',
        top: 8,
        alignSelf: 'center',
        width: 24,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(128,128,128,0.2)',
    },
    questionHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 16,
    },
    questionInput: {
        flex: 1,
        fontSize: 16,
        padding: 12,
        borderRadius: 4,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(128,128,128,0.2)',
    },
    deleteBtn: {
        padding: 8,
    },
    optionsContainer: {
        gap: 8,
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    optionInput: {
        flex: 1,
        fontSize: 14,
        paddingVertical: 8,
        backgroundColor: 'transparent',
    },
    addBlock: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderStyle: 'dashed',
        gap: 8,
    },
    addBlockText: {
        fontSize: 16,
        fontWeight: '600',
    },
    // Bottom Bar
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        borderTopWidth: 1,
        elevation: 10,
    },
    bottomBarContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    saveButton: {
        backgroundColor: '#4F46E5',
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
});

export default TeacherQuizCreatorScreen;
