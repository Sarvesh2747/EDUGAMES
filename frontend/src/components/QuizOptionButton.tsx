import React from 'react';
import { StyleSheet, Pressable, View } from 'react-native';
import { Text, useTheme, Surface } from 'react-native-paper';
import { useAppTheme } from '../context/ThemeContext';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { spacing, borderRadius } from '../theme';

interface QuizOptionButtonProps {
    text: string;
    isSelected: boolean;
    onPress: () => void;
    index: number;
    status?: 'correct' | 'wrong' | 'none';
    disabled?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const QuizOptionButton: React.FC<QuizOptionButtonProps> = ({
    text,
    isSelected,
    onPress,
    index,
    status = 'none',
    disabled = false
}) => {
    const { isDark } = useAppTheme();
    const theme = useTheme();
    const scale = useSharedValue(1);

    const handlePressIn = () => {
        if (!disabled) scale.value = withSpring(0.98);
    };

    const handlePressOut = () => {
        if (!disabled) scale.value = withSpring(1);
    };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    let backgroundColor = isDark ? '#1E293B' : '#fff';
    let borderColor = isDark ? '#334155' : theme.colors.outline;
    let textColor = isDark ? '#F8FAFC' : theme.colors.onSurface;
    let badgeColor = isDark ? '#334155' : '#F5F5F5';
    let badgeTextColor = isDark ? '#94A3B8' : '#666';

    if (status === 'correct') {
        backgroundColor = isDark ? 'rgba(76, 175, 80, 0.2)' : '#E8F5E9'; // Light Green
        borderColor = '#4CAF50';      // Green
        textColor = '#4CAF50';        // Green text
        badgeColor = '#4CAF50';
        badgeTextColor = '#fff';
    } else if (status === 'wrong') {
        backgroundColor = isDark ? 'rgba(244, 67, 54, 0.2)' : '#FFEBEE'; // Light Red
        borderColor = '#F44336';      // Red
        textColor = '#F44336';        // Red text
        badgeColor = '#F44336';
        badgeTextColor = '#fff';
    } else if (isSelected) {
        backgroundColor = theme.colors.primaryContainer;
        borderColor = theme.colors.primary;
        textColor = theme.colors.primary;
        badgeColor = theme.colors.primary;
        badgeTextColor = '#fff';
    }

    return (
        <AnimatedPressable
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={[styles.container, animatedStyle]}
            disabled={disabled}
        >
            <Surface style={[
                styles.button,
                {
                    backgroundColor,
                    borderColor,
                    borderWidth: (isSelected || status !== 'none') ? 2 : 1
                }
            ]} elevation={(isSelected || status !== 'none') ? 2 : 0}>
                <View style={[styles.indexBadge, { backgroundColor: badgeColor }]}>
                    <Text style={{ color: badgeTextColor, fontWeight: 'bold' }}>
                        {String.fromCharCode(65 + index)}
                    </Text>
                </View>
                <Text variant="bodyLarge" style={[styles.text, { color: textColor }]}>
                    {text}
                </Text>
            </Surface>
        </AnimatedPressable>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.md,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: 30, // Pill shape
        minHeight: 60,
    },
    indexBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    text: {
        flex: 1,
        fontWeight: '500',
    }
});

export default QuizOptionButton;
