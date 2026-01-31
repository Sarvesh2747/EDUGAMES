import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../context/ThemeContext';

interface ScreenBackgroundProps {
    children?: React.ReactNode;
    style?: any;
    forceDark?: boolean;
}

const ScreenBackground: React.FC<ScreenBackgroundProps> = ({ children, style, forceDark }) => {
    const { isDark: contextIsDark } = useAppTheme();
    const isDark = forceDark || contextIsDark;

    const stars = useMemo(() => {
        const starItems = [];
        for (let i = 0; i < 80; i++) {
            starItems.push(
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
        return starItems;
    }, []);

    return (
        <View style={[styles.container, style]}>
            <LinearGradient
                colors={isDark ? ['#0A1628', '#0F172A', '#1E293B'] : ['#F0F9FF', '#E0F2FE', '#BAE6FD']}
                style={[StyleSheet.absoluteFill, { zIndex: -1 }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            {isDark && (
                <View style={styles.starsContainer}>
                    {stars}
                </View>
            )}

            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    starsContainer: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 0,
    },
    star: {
        position: 'absolute',
        backgroundColor: '#FFFFFF',
        borderRadius: 50,
    },
});

export default ScreenBackground;
