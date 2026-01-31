import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { LanguageProvider } from './src/i18n';
import { ThemeProvider } from './src/context/ThemeContext';
import { SyncProvider } from './src/context/SyncContext';
import { ScreenTimeProvider } from './src/context/ScreenTimeContext';
import AppNavigator from './src/navigation/AppNavigator';
import { theme } from './src/theme';
import { LogBox, View, ActivityIndicator } from 'react-native';
import { useFonts } from 'expo-font';
import { MaterialCommunityIcons, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { decode, encode } from 'base-64';

if (!global.btoa) {
  global.btoa = encode;
}

if (!global.atob) {
  global.atob = decode;
}

// Completely suppress all console warnings in development
if (__DEV__) {
  const originalWarn = console.warn;
  const originalError = console.error;

  console.warn = (...args) => {
    const message = args[0]?.toString() || '';
    // Suppress all React Native Web deprecation warnings
    if (
      message.includes('shadow') ||
      message.includes('textShadow') ||
      message.includes('pointerEvents') ||
      message.includes('expo-av') ||
      message.includes('useNativeDriver') ||
      message.includes('React DevTools') ||
      message.includes('aria-hidden') ||
      message.includes('aria-hidden') ||
      message.includes('deprecated') ||
      message.includes('transform-origin') ||
      message.includes('Invalid DOM property') ||
      message.includes('onStartShouldSetResponder') ||
      message.includes('Unknown event handler property') ||
      message.includes('onResponderTerminationRequest') ||
      message.includes('onResponderGrant') ||
      message.includes('onResponderMove') ||
      message.includes('onResponderRelease') ||
      message.includes('onResponderTerminate')
    ) {
      return;
    }
    originalWarn.apply(console, args);
  };

  console.error = (...args) => {
    const message = args[0]?.toString() || '';
    // Only suppress specific non-critical errors
    if (
      message.includes('Download the React DevTools') ||
      message.includes('Download the React DevTools') ||
      message.includes('deprecated') ||
      message.includes('transform-origin') ||
      message.includes('Invalid DOM property') ||
      message.includes('onStartShouldSetResponder') ||
      message.includes('Unknown event handler property')
    ) {
      return;
    }
    originalError.apply(console, args);
  };
}

// Suppress LogBox warnings
LogBox.ignoreAllLogs(true);

export default function App() {
  const [fontsLoaded] = useFonts({
    ...MaterialCommunityIcons.font,
    ...Ionicons.font,
    ...MaterialIcons.font,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <SyncProvider>
              <ScreenTimeProvider>
                <StatusBar style="auto" />
                <AppNavigator />
                <BackendHealthCheck />
              </ScreenTimeProvider>
            </SyncProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

// Small component to handle the check using the configured API service
import api from './src/services/api';

function BackendHealthCheck() {
  useEffect(() => {
    const checkHealth = async () => {
      try {
        await api.get('/health');
        console.log('\n🚀 BACKEND CONNECTED SUCCESSFULLY\n');
      } catch (error) {
        console.log('\n❌ BACKEND CONNECTION FAILED: Make sure the backend server is running.\n');
      }
    };
    checkHealth();
  }, []);
  return null;
}
