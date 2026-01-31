import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Button, useTheme, ActivityIndicator, Surface } from 'react-native-paper';
import { getRandomQuiz, Quiz } from '../services/quizzesService';
import QuizOptionButton from '../components/QuizOptionButton';
import { useResponsive } from '../hooks/useResponsive';
import { spacing } from '../theme';
import Animated, { FadeInRight, SlideInDown } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { soundManager } from '../utils/soundEffects';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../services/api';

import { useAppTheme } from '../context/ThemeContext';
import ScreenBackground from '../components/ScreenBackground';

const QuizScreen = ({ navigation, route }: any) => {
    const { isDark } = useAppTheme();
    const paperTheme = useTheme();
    const insets = useSafeAreaInsets();
    const { containerStyle, isMobile } = useResponsive();
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
    const [score, setScore] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isAnswered, setIsAnswered] = useState(false);
    const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);

    const { quizData, previewMode } = (route.params as any) || {};

    useEffect(() => {
        // Hide Tab Bar when entering quiz mode for immersive experience
        navigation.getParent()?.setOptions({
            tabBarStyle: { display: 'none' }
        });

        loadQuiz();
        soundManager.initialize();

        return () => {
            soundManager.cleanup();
            // Restore Tab Bar when leaving
            navigation.getParent()?.setOptions({
                tabBarStyle: { display: 'flex' }
            });
        };
    }, []);

    const loadQuiz = async () => {
        setLoading(true);
        try {
            if (quizData) {
                let fullQuizData = quizData;

                // If questions are missing, fetch the full quiz
                if (!quizData.questions && quizData.quizId) {
                    try {
                        const response = await api.get(`/student/quiz/${quizData.quizId}`);
                        fullQuizData = response.data;
                    } catch (err) {
                        console.error('Failed to fetch full quiz details', err);
                    }
                }

                if (fullQuizData.questions) {
                    const formattedQuiz: Quiz = {
                        id: fullQuizData._id || fullQuizData.id,
                        title: fullQuizData.title,
                        questions: fullQuizData.questions,
                    };
                    setQuiz(formattedQuiz);
                    setUserAnswers(new Array(formattedQuiz.questions.length).fill(null));
                } else {
                    // Fallback or error handling if still no questions
                    console.error('Quiz data missing questions even after fetch attempt');
                }
            } else {
                const randomQuiz = await getRandomQuiz();
                setQuiz(randomQuiz);
                if (randomQuiz) {
                    setUserAnswers(new Array(randomQuiz.questions.length).fill(null));
                }
            }
        } catch (error) {
            console.error('Failed to load quiz:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOptionSelect = async (index: number) => {
        if (isAnswered) return;

        setSelectedOptionIndex(index);
        setIsAnswered(true);

        // Record user answer
        const newAnswers = [...userAnswers];
        newAnswers[currentQuestionIndex] = index;
        setUserAnswers(newAnswers);

        const currentQuestion = quiz!.questions[currentQuestionIndex];
        const isCorrect = index === currentQuestion.correctIndex;

        if (isCorrect) {
            await soundManager.playCorrect();
            setScore(score + 1);
        } else {
            await soundManager.playWrong();
        }
    };

    const handleNext = () => {
        soundManager.playClick();
        if (!quiz) return;

        if (currentQuestionIndex < quiz.questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setSelectedOptionIndex(null);
            setIsAnswered(false);
        } else {
            finishQuiz(score);
        }
    };

    const finishQuiz = (finalScore: number) => {
        soundManager.playSuccess();
        navigation.replace('QuizResult', {
            score: finalScore,
            totalQuestions: quiz?.questions.length || 0,
            correctAnswers: finalScore,
            quizId: quiz?.id,
            questions: quiz?.questions,
            userAnswers: userAnswers,
            title: quiz?.title,
            assignmentId: quizData?.assignmentId,
        });
    };

    if (loading) {
        return (
            <ScreenBackground style={styles.centerContainer}>
                <ActivityIndicator size="large" color={paperTheme.colors.primary} />
                <Text style={{ marginTop: 16, color: isDark ? '#ccc' : '#666' }}>Loading Quiz...</Text>
            </ScreenBackground>
        );
    }

    if (!quiz || quiz.questions.length === 0) {
        return (
            <ScreenBackground style={styles.centerContainer}>
                <MaterialCommunityIcons name="alert-circle-outline" size={48} color={isDark ? '#ccc' : '#666'} />
                <Text style={{ marginTop: 16, color: isDark ? '#fff' : '#000' }}>No questions available.</Text>
                <Button mode="contained" onPress={() => navigation.goBack()} style={{ marginTop: 24 }}>
                    Go Back
                </Button>
            </ScreenBackground>
        );
    }

    const currentQuestion = quiz.questions[currentQuestionIndex];
    const progress = (currentQuestionIndex + 1) / quiz.questions.length;
    const isCorrect = selectedOptionIndex === currentQuestion.correctIndex;

    return (
        <ScreenBackground style={styles.container}>
            <ScrollView
                // MAX WIDTH CONSTRAINT ADDED HERE (maxWidth: 700)
                contentContainerStyle={[styles.content, containerStyle, { maxWidth: 700, alignSelf: 'center', width: '100%', paddingHorizontal: isMobile ? spacing.md : spacing.xl }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Modern Header */}
                <Surface style={[styles.headerCard, { paddingTop: insets.top + spacing.sm }]} elevation={4}>
                    <LinearGradient
                        colors={isDark ? ['#4F46E5', '#7C3AED'] : ['#6366F1', '#8B5CF6']}
                        style={styles.headerGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        {/* Top Row: Close & Score (Optional) */}
                        <View style={styles.headerTopRow}>
                            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
                                <MaterialCommunityIcons name="close" size={24} color="#fff" />
                            </TouchableOpacity>
                            <View style={styles.chipContainer}>
                                <MaterialCommunityIcons name="clock-outline" size={16} color="rgba(255,255,255,0.8)" style={{ marginRight: 4 }} />
                                <Text style={styles.chipText}>Quiz Mode</Text>
                            </View>
                        </View>

                        {/* Progress Section */}
                        <View style={styles.progressSection}>
                            <View style={styles.questionCounter}>
                                <Text style={styles.questionCurrent}>{currentQuestionIndex + 1}</Text>
                                <Text style={styles.questionTotal}>/{quiz.questions.length}</Text>
                            </View>
                            <View style={styles.progressBarTrack}>
                                <Animated.View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
                            </View>
                        </View>
                    </LinearGradient>
                </Surface>

                {/* Question Card */}
                <Animated.View
                    key={currentQuestionIndex}
                    entering={FadeInRight.duration(400)}
                    style={styles.questionContainer}
                >
                    <Surface style={[styles.questionCard, { backgroundColor: isDark ? '#1E293B' : '#fff' }]} elevation={2}>
                        <Text variant="headlineSmall" style={[styles.questionText, { color: isDark ? '#F1F5F9' : '#1E293B' }]}>
                            {currentQuestion.question}
                        </Text>
                    </Surface>

                    {/* Options */}
                    <View style={styles.optionsContainer}>
                        {currentQuestion.options.map((option, index) => {
                            let status: 'correct' | 'wrong' | 'none' = 'none';
                            if (isAnswered) {
                                if (index === currentQuestion.correctIndex) {
                                    status = 'correct';
                                } else if (index === selectedOptionIndex) {
                                    status = 'wrong';
                                }
                            }

                            return (
                                <QuizOptionButton
                                    key={index}
                                    text={option}
                                    isSelected={selectedOptionIndex === index}
                                    onPress={() => handleOptionSelect(index)}
                                    index={index}
                                    status={status}
                                    disabled={isAnswered}
                                />
                            );
                        })}
                    </View>
                </Animated.View>

                {/* Feedback & Next Button */}
                {isAnswered && (
                    <Animated.View
                        entering={SlideInDown.springify()}
                        style={styles.feedbackSection}
                    >
                        <Surface style={[
                            styles.feedbackCard,
                            { borderLeftColor: isCorrect ? '#10B981' : '#EF4444', backgroundColor: isDark ? '#1E293B' : '#fff' }
                        ]} elevation={3}>
                            <View style={styles.feedbackContent}>
                                <View style={styles.feedbackHeader}>
                                    <MaterialCommunityIcons
                                        name={isCorrect ? "check-circle" : "close-circle"}
                                        size={28}
                                        color={isCorrect ? "#10B981" : "#EF4444"}
                                    />
                                    <Text variant="titleMedium" style={{
                                        color: isCorrect ? "#10B981" : "#EF4444",
                                        fontWeight: 'bold',
                                        marginLeft: 12
                                    }}>
                                        {isCorrect ? "Correct!" : "Incorrect"}
                                    </Text>
                                </View>
                                {!isCorrect && (
                                    <Text variant="bodyMedium" style={{ marginTop: 8, color: isDark ? '#94A3B8' : '#64748B', marginLeft: 40 }}>
                                        Correct answer: <Text style={{ fontWeight: 'bold', color: isDark ? '#F1F5F9' : '#1E293B' }}>{currentQuestion.options[currentQuestion.correctIndex]}</Text>
                                    </Text>
                                )}
                            </View>
                            <Button
                                mode="contained"
                                onPress={handleNext}
                                style={[styles.nextButton, { backgroundColor: isCorrect ? '#10B981' : paperTheme.colors.primary }]}
                                contentStyle={{ height: 50 }}
                                labelStyle={{ fontSize: 16, fontWeight: '700' }}
                            >
                                {currentQuestionIndex === quiz.questions.length - 1 ? 'Finish' : 'Next'}
                            </Button>
                        </Surface>
                    </Animated.View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>
        </ScreenBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        paddingBottom: 40,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerCard: {
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        marginBottom: 32,
        overflow: 'hidden',
        marginHorizontal: 12,
        marginTop: 8,
        borderRadius: 32, // Floating header look
    },
    headerGradient: {
        paddingHorizontal: spacing.xl,
        paddingBottom: spacing.xl,
    },
    headerTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    chipContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    chipText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 12,
    },
    progressSection: {
        alignItems: 'center',
    },
    questionCounter: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 12,
    },
    questionCurrent: {
        fontSize: 32,
        fontWeight: '800',
        color: '#fff',
        lineHeight: 32,
    },
    questionTotal: {
        fontSize: 18,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.7)',
        marginLeft: 4,
    },
    progressBarTrack: {
        height: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 4,
        width: '100%',
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#FACC15', // Yellow/Gold pop
        borderRadius: 4,
    },
    questionContainer: {
        paddingHorizontal: spacing.md,
    },
    questionCard: {
        padding: spacing.xl,
        borderRadius: 24,
        marginBottom: spacing.xl,
        minHeight: 160,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)', // Subtle border for darkness
    },
    questionText: {
        fontWeight: '700',
        textAlign: 'center',
        lineHeight: 34,
    },
    optionsContainer: {
        gap: spacing.md,
        marginBottom: spacing.xl,
    },
    feedbackSection: {
        paddingHorizontal: spacing.md,
        marginTop: spacing.md,
    },
    feedbackCard: {
        borderRadius: 20,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderLeftWidth: 6,
    },
    feedbackContent: {
        flex: 1,
        marginRight: 16,
    },
    feedbackHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    nextButton: {
        borderRadius: 16,
        minWidth: 110,
        elevation: 2,
    },
});

export default QuizScreen;
