import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, StatusBar, TextInput } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { useAuth } from '../context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CoreTechLogo from '../components/CoreTechLogo';
import ScreenBackground from '../components/ScreenBackground';

const ROLES = [
    { value: 'student', label: 'Student', icon: 'account-school', color: '#a78bfa' },
    { value: 'teacher', label: 'Teacher', icon: 'human-male-board', color: '#c084fc' },
    { value: 'institute', label: 'Institute', icon: 'office-building', color: '#818cf8' },
    { value: 'admin', label: 'Admin', icon: 'shield-account', color: '#f472b6' },
];

const NewRegisterScreen = ({ navigation }: any) => {
    const { register } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'student' | 'teacher' | 'admin' | 'institute'>('student');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const insets = useSafeAreaInsets();

    const handleRegister = async () => {
        if (!name || !email || !password) {
            setError('Please fill in all fields');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await register({ name, email, password, language: 'en', role });
        } catch (e: any) {
            setError(e?.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScreenBackground style={styles.container} forceDark={true}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Logo & Branding */}
                    <Animated.View entering={FadeInDown.delay(200).duration(1000)} style={styles.header}>
                        <View style={styles.logoContainer}>
                            <CoreTechLogo width={80} height={80} />
                        </View>
                        <Text style={styles.brandName}>CoreTechLabs</Text>
                        <Text style={styles.pageTitle}>Sign up To Your Account</Text>
                        <Text style={styles.pageSubtitle}>
                            Access your account to manage settings, explore features.
                        </Text>
                    </Animated.View>

                    {/* Form Card */}
                    <Animated.View entering={FadeInUp.delay(400).duration(1000)} style={styles.formCard}>
                        {/* Name Input */}
                        <View style={styles.inputWrapper}>
                            <Text style={styles.inputLabel}>Name</Text>
                            <View style={styles.inputContainer}>
                                <MaterialCommunityIcons name="account-outline" size={20} color="#a78bfa" style={styles.inputIcon} />
                                <TextInput
                                    value={name}
                                    onChangeText={(text) => {
                                        setName(text);
                                        setError('');
                                    }}
                                    style={styles.input}
                                    placeholder="John Doe"
                                    placeholderTextColor="#6b7280"
                                    selectionColor="#a78bfa"
                                />
                            </View>
                        </View>

                        {/* Email Input */}
                        <View style={styles.inputWrapper}>
                            <Text style={styles.inputLabel}>Email</Text>
                            <View style={styles.inputContainer}>
                                <MaterialCommunityIcons name="email-outline" size={20} color="#a78bfa" style={styles.inputIcon} />
                                <TextInput
                                    value={email}
                                    onChangeText={(text) => {
                                        setEmail(text);
                                        setError('');
                                    }}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    style={styles.input}
                                    placeholder="johndoe@example.com"
                                    placeholderTextColor="#6b7280"
                                    selectionColor="#a78bfa"
                                />
                            </View>
                        </View>

                        {/* Password Input */}
                        <View style={styles.inputWrapper}>
                            <Text style={styles.inputLabel}>Password</Text>
                            <View style={styles.inputContainer}>
                                <MaterialCommunityIcons name="lock-outline" size={20} color="#a78bfa" style={styles.inputIcon} />
                                <TextInput
                                    value={password}
                                    onChangeText={(text) => {
                                        setPassword(text);
                                        setError('');
                                    }}
                                    secureTextEntry={!showPassword}
                                    style={styles.input}
                                    placeholder="••••••••"
                                    placeholderTextColor="#6b7280"
                                    selectionColor="#a78bfa"
                                />
                                <TouchableOpacity
                                    onPress={() => setShowPassword(!showPassword)}
                                    style={styles.eyeIcon}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <MaterialCommunityIcons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#6b7280" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Role Selection */}
                        <View style={styles.roleSection}>
                            <Text style={styles.roleTitle}>Select Your Role</Text>
                            <View style={styles.roleGrid}>
                                {ROLES.map((roleItem, index) => (
                                    <Animated.View
                                        key={roleItem.value}
                                        entering={ZoomIn.delay(600 + index * 100).duration(400)}
                                        style={styles.roleCardWrapper}
                                    >
                                        <TouchableOpacity
                                            onPress={() => setRole(roleItem.value as any)}
                                            activeOpacity={0.7}
                                            style={[
                                                styles.roleCard,
                                                role === roleItem.value && styles.roleCardActive
                                            ]}
                                        >
                                            <MaterialCommunityIcons
                                                name={roleItem.icon as any}
                                                size={24}
                                                color={role === roleItem.value ? roleItem.color : '#6b7280'}
                                            />
                                            <Text style={[
                                                styles.roleLabel,
                                                role === roleItem.value && styles.roleLabelActive
                                            ]}>
                                                {roleItem.label}
                                            </Text>
                                            {role === roleItem.value && (
                                                <View style={[styles.checkmark, { backgroundColor: roleItem.color }]}>
                                                    <MaterialCommunityIcons name="check" size={10} color="#fff" />
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    </Animated.View>
                                ))}
                            </View>
                        </View>

                        {/* Error Message */}
                        {error ? (
                            <Animated.View entering={FadeInDown} style={styles.errorContainer}>
                                <MaterialCommunityIcons name="alert-circle" size={16} color="#ef4444" />
                                <Text style={styles.errorText}>{error}</Text>
                            </Animated.View>
                        ) : null}

                        {/* Sign Up Button */}
                        <TouchableOpacity
                            onPress={handleRegister}
                            disabled={loading}
                            style={styles.registerBtnWrapper}
                            activeOpacity={0.9}
                        >
                            <LinearGradient
                                colors={['#7c3aed', '#a78bfa']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.registerBtn}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <Text style={styles.registerBtnText}>Sign up</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Sign In Link */}
                        <View style={styles.signinRow}>
                            <Text style={styles.signinText}>Already have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                <Text style={styles.signinLink}>Sign in</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>

                </ScrollView>
            </KeyboardAvoidingView>
        </ScreenBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    background: {
        position: 'absolute',
        width: '100%',
        height: '100%',
    },
    glowTop: {
        position: 'absolute',
        top: -150,
        right: -150,
        width: 400,
        height: 400,
        borderRadius: 200,
        backgroundColor: 'rgba(167, 139, 250, 0.08)',
    },
    glowBottom: {
        position: 'absolute',
        bottom: -100,
        left: -100,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: 'rgba(139, 92, 246, 0.06)',
    },
    keyboardView: {
        flex: 1,
        zIndex: 1,
        width: '100%',
        alignItems: 'center',
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingBottom: 32,
        width: '100%',
        maxWidth: 450,
        alignSelf: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
        marginTop: 40,
    },
    logoContainer: {
        marginBottom: 24,
        alignItems: 'center',
        shadowColor: '#7c3aed',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
    },
    brandName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#a78bfa',
        letterSpacing: 1.5,
        marginBottom: 16,
        textTransform: 'uppercase',
    },
    pageTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 12,
        textAlign: 'center',
    },
    pageSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 10,
    },
    formCard: {
        backgroundColor: 'rgba(26, 26, 46, 0.7)',
        borderRadius: 24,
        padding: 32,
        borderWidth: 1,
        borderColor: 'rgba(167, 139, 250, 0.1)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        ...Platform.select({
            web: {
                backdropFilter: 'blur(10px)',
            }
        }),
    },
    inputWrapper: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#e5e7eb',
        marginBottom: 8,
        marginLeft: 4,
    },
    inputContainer: {
        backgroundColor: 'rgba(17, 24, 39, 0.6)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(107, 114, 128, 0.2)',
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        backgroundColor: 'transparent',
        fontSize: 15,
        color: '#fff',
        height: 56,
        paddingHorizontal: 0,
    },
    eyeIcon: {
        padding: 8,
    },
    roleSection: {
        marginBottom: 24,
    },
    roleTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#e5e7eb',
        marginBottom: 16,
        marginLeft: 4,
    },
    roleGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'space-between',
    },
    roleCardWrapper: {
        width: '48%',
    },
    roleCard: {
        backgroundColor: 'rgba(17, 24, 39, 0.5)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(107, 114, 128, 0.2)',
        padding: 16,
        alignItems: 'center',
        position: 'relative',
        minHeight: 100, // Slightly taller
        justifyContent: 'center',
    },
    roleCardActive: {
        borderColor: '#a78bfa',
        borderWidth: 2,
        backgroundColor: 'rgba(167, 139, 250, 0.15)',
        shadowColor: '#a78bfa',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    roleLabel: {
        fontSize: 13,
        fontWeight: '500',
        color: '#9ca3af',
        marginTop: 8,
    },
    roleLabelActive: {
        color: '#e5e7eb',
        fontWeight: '700',
    },
    checkmark: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    errorText: {
        color: '#f87171',
        fontSize: 14,
        marginLeft: 8,
        flex: 1,
        fontWeight: '500',
    },
    registerBtnWrapper: {
        borderRadius: 16,
        shadowColor: '#7c3aed',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
        elevation: 8,
        marginBottom: 20,
    },
    registerBtn: {
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    registerBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    signinRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },
    signinText: {
        color: '#9ca3af',
        fontSize: 14,
    },
    signinLink: {
        color: '#a78bfa',
        fontSize: 14,
        fontWeight: '700',
    },
});

export default NewRegisterScreen;
