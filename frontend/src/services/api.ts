import axios from 'axios';
import { Platform } from 'react-native';
import { STORAGE_KEYS } from '../utils/constants';
import { getData } from '../offline/offlineStorage';

// API Configuration
// -----------------
// For Web/Emulator: use localhost
// For Physical Device: use your computer's IP address (check with 'ipconfig' on Windows or 'ifconfig' on Mac/Linux)
// 
// To change the API URL, set EXPO_PUBLIC_API_URL in your .env file or update the default below
// Example for physical device: 'http://192.168.1.7:5000/api' (replace with your computer's IP)

import Constants from 'expo-constants';

const getDefaultApiUrl = () => {
    // For Web/Emulator: use localhost if explicitly running there
    if (Platform.OS === 'web') {
        return 'http://127.0.0.1:5000/api';
    }

    // Dynamic IP detection for development (Expo Go / Dev Client)
    // This allows the app to automatically connect to the machine running the bundler (metro)
    // regardless of the IP address changes.
    if (__DEV__) {
        const debuggerHost = Constants.expoConfig?.hostUri;
        if (debuggerHost) {
            const ip = debuggerHost.split(':')[0];
            return `http://${ip}:5000/api`;
        }
    }

    // Fallback or explicit override
    return 'http://192.168.1.7:5000/api'; // Fallback to last known IP for this session
};

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || getDefaultApiUrl();

// Log the API URL for debugging
console.log('🌐 API Base URL:', API_BASE_URL);

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 60000, // 60 seconds timeout for AI generation
});

api.interceptors.request.use(
    async (config) => {
        const token = await getData(STORAGE_KEYS.USER_TOKEN);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Log all API requests for debugging
        console.log('📡 API Request:', {
            method: config.method?.toUpperCase(),
            url: config.url,
            baseURL: config.baseURL,
            fullURL: `${config.baseURL}${config.url}`,
            hasData: !!config.data
        });

        return config;
    },
    (error) => {
        console.error('❌ Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor for global error handling
api.interceptors.response.use(
    (response) => {
        console.log('✅ API Response:', {
            status: response.status,
            url: response.config.url,
            hasData: !!response.data
        });
        return response;
    },
    (error) => {
        // Log error for debugging
        console.error('❌ API Error Details:', {
            url: error.config?.url,
            method: error.config?.method,
            baseURL: error.config?.baseURL,
            status: error.response?.status,
            message: error.response?.data?.message || error.message,
            errorType: error.code,
            hasResponse: !!error.response,
            hasRequest: !!error.request
        });

        // Handle specific error cases
        if (error.response) {
            // Server responded with error status
            const { status, data } = error.response;

            switch (status) {
                case 401:
                    // Unauthorized - could trigger logout
                    console.warn('⚠️ Unauthorized access - token may be invalid');
                    break;
                case 403:
                    console.warn('⚠️ Forbidden - insufficient permissions');
                    break;
                case 404:
                    console.warn('⚠️ Resource not found');
                    break;
                case 500:
                    console.error('⚠️ Server error');
                    break;
            }

            // Return formatted error
            return Promise.reject({
                message: data?.message || 'An error occurred',
                status,
                data,
                response: error.response
            });
        } else if (error.request) {
            // Request made but no response
            console.error('❌ Network Error - No response from server');
            return Promise.reject({
                message: 'Network error - please check your connection',
                isNetworkError: true
            });
        } else {
            // Something else happened
            console.error('❌ Unexpected error:', error.message);
            return Promise.reject({
                message: error.message || 'An unexpected error occurred'
            });
        }
    }
);

export default api;
