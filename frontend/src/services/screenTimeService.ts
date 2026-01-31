/**
 * Screen Time Tracking Service
 * Tracks how much time users spend in the app
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import api from './api';
import { getData } from '../offline/offlineStorage';
import { STORAGE_KEYS } from '../utils/constants';

const SCREEN_TIME_KEY = 'screen_time_data';
const SESSION_KEY = 'current_session';

export interface ActivityBreakdown {
    games: number;
    lessons: number;
    quizzes: number;
    other: number;
}

export interface DailyScreenTime {
    date: string; // YYYY-MM-DD format
    totalMinutes: number;
    breakdown: ActivityBreakdown;
    sessions: number;
}

export interface ScreenTimeStats {
    today: DailyScreenTime;
    thisWeek: DailyScreenTime[];
    dailyGoalMinutes: number;
    averageDaily: number;
}

class ScreenTimeService {
    private sessionStartTime: number | null = null;
    private currentActivity: keyof ActivityBreakdown = 'other';
    private trackingInterval: NodeJS.Timeout | null = null;

    /**
     * Start tracking a session
     */
    async startSession(): Promise<void> {
        this.sessionStartTime = Date.now();
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({
            startTime: this.sessionStartTime,
            activity: this.currentActivity
        }));
        console.log('[ScreenTime] Session started');

        // Update every minute while session is active
        this.trackingInterval = setInterval(() => {
            this.saveSessionProgress();
        }, 60000); // Every 1 minute
    }

    /**
     * End the current session and save the time
     */
    async endSession(): Promise<void> {
        if (this.trackingInterval) {
            clearInterval(this.trackingInterval);
            this.trackingInterval = null;
        }

        if (!this.sessionStartTime) {
            // Try to recover from AsyncStorage
            const sessionData = await AsyncStorage.getItem(SESSION_KEY);
            if (sessionData) {
                const parsed = JSON.parse(sessionData);
                this.sessionStartTime = parsed.startTime;
                this.currentActivity = parsed.activity || 'other';
            }
        }

        if (this.sessionStartTime) {
            const duration = Math.floor((Date.now() - this.sessionStartTime) / 60000); // minutes
            if (duration > 0) {
                await this.logTime(duration, this.currentActivity);
            }
            this.sessionStartTime = null;
            await AsyncStorage.removeItem(SESSION_KEY);
            console.log('[ScreenTime] Session ended, logged', duration, 'minutes');
        }
    }

    /**
     * Save session progress periodically
     */
    private async saveSessionProgress(): Promise<void> {
        if (this.sessionStartTime) {
            const duration = Math.floor((Date.now() - this.sessionStartTime) / 60000);
            if (duration > 0) {
                await this.logTime(1, this.currentActivity);
            }
        }
    }

    /**
     * Set the current activity type
     */
    setActivity(activity: keyof ActivityBreakdown): void {
        this.currentActivity = activity;
    }

    /**
     * Log time spent on an activity
     */
    async logTime(minutes: number, activity: keyof ActivityBreakdown = 'other'): Promise<void> {
        try {
            const today = this.getTodayDateString();
            const allData = await this.getAllScreenTimeData();

            let todayData = allData.find(d => d.date === today);
            if (!todayData) {
                todayData = {
                    date: today,
                    totalMinutes: 0,
                    breakdown: { games: 0, lessons: 0, quizzes: 0, other: 0 },
                    sessions: 1
                };
                allData.push(todayData);
            }

            todayData.totalMinutes += minutes;
            todayData.breakdown[activity] += minutes;

            // Keep only last 30 days
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const filtered = allData.filter(d => new Date(d.date) >= thirtyDaysAgo);

            await AsyncStorage.setItem(SCREEN_TIME_KEY, JSON.stringify(filtered));
        } catch (error) {
            console.error('[ScreenTime] Error logging time:', error);
        }
    }

    /**
     * Get all screen time data from local storage
     */
    async getAllScreenTimeData(): Promise<DailyScreenTime[]> {
        try {
            const data = await AsyncStorage.getItem(SCREEN_TIME_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('[ScreenTime] Error getting data:', error);
            return [];
        }
    }

    /**
     * Get screen time statistics
     */
    async getStats(): Promise<ScreenTimeStats> {
        const allData = await this.getAllScreenTimeData();
        const today = this.getTodayDateString();

        // Get today's data
        let todayData = allData.find(d => d.date === today);
        if (!todayData) {
            todayData = {
                date: today,
                totalMinutes: 0,
                breakdown: { games: 0, lessons: 0, quizzes: 0, other: 0 },
                sessions: 0
            };
        }

        // Get last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const thisWeek = allData.filter(d => new Date(d.date) >= sevenDaysAgo);

        // Fill in missing days with zeros
        const weekData: DailyScreenTime[] = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateString = this.formatDate(date);
            const existing = thisWeek.find(d => d.date === dateString);
            if (existing) {
                weekData.push(existing);
            } else {
                weekData.push({
                    date: dateString,
                    totalMinutes: 0,
                    breakdown: { games: 0, lessons: 0, quizzes: 0, other: 0 },
                    sessions: 0
                });
            }
        }

        // Calculate average
        const totalMinutes = weekData.reduce((sum, d) => sum + d.totalMinutes, 0);
        const averageDaily = Math.round(totalMinutes / 7);

        // Get daily goal
        const goalStr = await AsyncStorage.getItem('daily_goal_minutes');
        const dailyGoalMinutes = goalStr ? parseInt(goalStr, 10) : 60;

        return {
            today: todayData,
            thisWeek: weekData,
            dailyGoalMinutes,
            averageDaily
        };
    }

    /**
     * Set daily usage goal
     */
    async setDailyGoal(minutes: number): Promise<void> {
        await AsyncStorage.setItem('daily_goal_minutes', minutes.toString());
    }

    /**
     * Sync screen time data with backend
     */
    async syncWithBackend(userId: string): Promise<void> {
        try {
            const netInfo = await NetInfo.fetch();
            if (!netInfo.isConnected) {
                // console.log('[ScreenTime] Offline, skipping sync');
                return;
            }

            // Check for valid token before attempting sync
            const token = await getData(STORAGE_KEYS.USER_TOKEN);
            if (!token) {
                // console.log('[ScreenTime] No token found, skipping sync');
                return;
            }

            const allData = await this.getAllScreenTimeData();
            if (allData.length === 0) return;

            await api.post('/wellbeing/sync', {
                userId,
                screenTimeData: allData
            });

            console.log('[ScreenTime] Synced with backend');
        } catch (error: any) {
            // Suppress 401 errors to avoid console noise (handled by AuthContext/interceptors)
            if (error.response?.status === 401 || error.status === 401) {
                // console.warn('[ScreenTime] Exiting sync due to auth error');
                return;
            }
            console.error('[ScreenTime] Sync failed:', error.message || error);
        }
    }

    /**
     * Helper: Get today's date as YYYY-MM-DD string
     */
    private getTodayDateString(): string {
        return this.formatDate(new Date());
    }

    /**
     * Helper: Format date as YYYY-MM-DD
     */
    private formatDate(date: Date): string {
        return date.toISOString().split('T')[0];
    }

    /**
     * Format minutes as readable string
     */
    formatDuration(minutes: number): string {
        if (minutes < 60) {
            return `${minutes}m`;
        }
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
}

export const screenTimeService = new ScreenTimeService();
export default screenTimeService;
