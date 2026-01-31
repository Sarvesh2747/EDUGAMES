import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, Platform } from 'react-native';
import { Text, useTheme, IconButton, Surface } from 'react-native-paper';
import Markdown, { RenderRules } from 'react-native-markdown-display';
import GradientBackground from '../../components/ui/GradientBackground';
import CustomButton from '../../components/ui/CustomButton';
import { spacing, gradients, borderRadius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';
import XPToast from '../../components/learn/XPToast';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { progressService } from '../../services/progressService';

const LessonReaderScreen = ({ route, navigation }: any) => {
    const { title, content, xpReward = 10, chapterId, subjectId, classId } = route.params;
    const theme = useTheme();
    const { isDark } = useAppTheme();
    const { addXP } = useAuth();
    const [completed, setCompleted] = useState(false);
    const [showToast, setShowToast] = useState(false);

    const styles = createStyles(isDark);
    const mdStyles = createMarkdownStyles(isDark);

    const rules: RenderRules = {
        image: (node, children, parent, styles) => {
            const { src, alt } = node.attributes;
            return (
                <Image
                    key={node.key}
                    style={{
                        width: '100%',
                        height: 200,
                        resizeMode: 'contain',
                        borderRadius: 12,
                        marginVertical: 10,
                        backgroundColor: isDark ? '#1E293B' : '#F5F5F7',
                    }}
                    source={{ uri: src }}
                    accessibilityLabel={alt}
                />
            );
        },
    };

    const handleComplete = async () => {
        if (!completed) {
            addXP(xpReward, 'lesson_complete');
            setCompleted(true);
            setShowToast(true);

            // Mark chapter as complete if all IDs are provided
            if (chapterId && subjectId && classId) {
                console.log('[LessonReader] Marking chapter complete:', { chapterId, subjectId, classId });
                await progressService.markChapterComplete(chapterId, subjectId, classId);
            } else {
                console.warn('[LessonReader] Missing IDs for progress tracking:', { chapterId, subjectId, classId });
            }

            // Navigate back after a delay
            setTimeout(() => {
                navigation.goBack();
            }, 2000);
        }
    };

    return (
        <View style={styles.container}>
            <XPToast
                visible={showToast}
                xp={xpReward}
                onHide={() => setShowToast(false)}
            />

            {/* Enhanced Header with Gradient */}
            <LinearGradient
                colors={['#FF9A62', '#FFB88C']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerGradient}
            >
                <View style={styles.header}>
                    <IconButton
                        icon="arrow-left"
                        iconColor="#fff"
                        size={24}
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                    />
                    <View style={styles.headerTitleContainer}>
                        <Text variant="titleMedium" style={styles.headerTitle} numberOfLines={2}>
                            {title}
                        </Text>
                    </View>
                    <View style={{ width: 48 }} />
                </View>
            </LinearGradient>

            {/* Content Card with Modern Design */}
            <Animated.View
                entering={Platform.OS === 'web' ? undefined : FadeInDown.duration(400)}
                style={styles.contentCard}
            >
                <Surface style={styles.contentSurface} elevation={4}>
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.contentContainer}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Chapter Title */}
                        <View style={styles.chapterHeader}>
                            <View style={styles.chapterIconContainer}>
                                <MaterialCommunityIcons name="book-open-variant" size={24} color="#FF9A62" />
                            </View>
                            <Text style={styles.chapterTitle}>{title}</Text>
                        </View>

                        {/* Markdown Content */}
                        <View style={styles.markdownContainer}>
                            <Markdown style={mdStyles} rules={rules}>
                                {content}
                            </Markdown>
                        </View>

                        {/* Bottom Spacing */}
                        <View style={{ height: completed ? 40 : 120 }} />
                    </ScrollView>
                </Surface>
            </Animated.View>

            {/* Enhanced Complete Button */}
            {!completed && (
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.completeButtonContainer}
                        onPress={handleComplete}
                        activeOpacity={0.9}
                    >
                        <LinearGradient
                            colors={['#6A5AE0', '#8B7AFF']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.completeButton}
                        >
                            <MaterialCommunityIcons name="check-circle" size={22} color="#fff" />
                            <Text style={styles.completeButtonText}>Mark as Complete</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const createStyles = (isDark: boolean) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: isDark ? '#0F172A' : '#F5F5F7',
    },
    headerGradient: {
        paddingTop: spacing.xl + 10,
        paddingBottom: spacing.lg,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        shadowColor: '#FF9A62',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 8,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
    },
    headerTitleContainer: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: spacing.sm,
    },
    headerTitle: {
        color: '#fff',
        fontWeight: '800',
        textAlign: 'center',
        fontSize: 18,
        lineHeight: 24,
    },
    backButton: {
        margin: 0,
        backgroundColor: 'rgba(255,255,255,0.25)',
        borderRadius: 14,
    },
    contentCard: {
        flex: 1,
        marginTop: -spacing.md,
        marginHorizontal: spacing.md,
        marginBottom: spacing.md,
    },
    contentSurface: {
        flex: 1,
        borderRadius: 24,
        backgroundColor: isDark ? '#1E293B' : '#fff',
        overflow: 'hidden',
    },
    scrollView: {
        flex: 1,
    },
    contentContainer: {
        padding: spacing.xl,
    },
    chapterHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.xl,
        paddingBottom: spacing.lg,
        borderBottomWidth: 2,
        borderBottomColor: isDark ? '#334155' : '#F0F0F0',
    },
    chapterIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#FFF5F0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    chapterTitle: {
        flex: 1,
        fontSize: 22,
        fontWeight: '800',
        color: isDark ? '#F1F5F9' : '#1A1A1A',
        lineHeight: 28,
    },
    markdownContainer: {
        flex: 1,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: spacing.lg,
        backgroundColor: isDark ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.95)',
        borderTopWidth: 1,
        borderTopColor: isDark ? '#334155' : '#F0F0F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
    },
    completeButtonContainer: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#6A5AE0',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    completeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 10,
    },
    completeButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});

const createMarkdownStyles = (isDark: boolean) => ({
    body: {
        fontSize: 16,
        lineHeight: 26,
        color: isDark ? '#CBD5E1' : '#333',
        fontFamily: 'System',
    },
    heading1: {
        fontSize: 26,
        fontWeight: '800' as const,
        color: isDark ? '#F1F5F9' : '#1A1A1A',
        marginBottom: 16,
        marginTop: 24,
        lineHeight: 34,
    },
    heading2: {
        fontSize: 22,
        fontWeight: '700' as const,
        color: isDark ? '#F1F5F9' : '#1A1A1A',
        marginBottom: 14,
        marginTop: 20,
        lineHeight: 30,
    },
    heading3: {
        fontSize: 18,
        fontWeight: '700' as const,
        color: isDark ? '#E2E8F0' : '#333',
        marginBottom: 12,
        marginTop: 16,
        lineHeight: 26,
    },
    paragraph: {
        marginBottom: 18,
        lineHeight: 26,
    },
    list_item: {
        marginBottom: 10,
        paddingLeft: 8,
    },
    bullet_list: {
        marginBottom: 16,
    },
    ordered_list: {
        marginBottom: 16,
    },
    strong: {
        fontWeight: '700' as const,
        color: isDark ? '#F1F5F9' : '#1A1A1A',
    },
    em: {
        fontStyle: 'italic' as const,
        color: isDark ? '#94A3B8' : '#555',
    },
    code_inline: {
        backgroundColor: isDark ? '#334155' : '#F5F5F7',
        color: '#6A5AE0',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        fontSize: 15,
        fontFamily: 'monospace',
    },
    code_block: {
        backgroundColor: isDark ? '#1E293B' : '#F5F5F7',
        padding: 16,
        borderRadius: 12,
        marginVertical: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#6A5AE0',
    },
    blockquote: {
        backgroundColor: isDark ? '#1E293B' : '#FFF5F0',
        borderLeftWidth: 4,
        borderLeftColor: '#FF9A62',
        paddingLeft: 16,
        paddingVertical: 12,
        marginVertical: 12,
        borderRadius: 8,
    },
});

export default LessonReaderScreen;
