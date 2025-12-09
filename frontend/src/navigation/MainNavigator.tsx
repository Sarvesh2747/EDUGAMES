import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CustomTabBar from '../components/navigation/CustomTabBar';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import GamesScreen from '../screens/GamesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import NotificationScreen from '../screens/NotificationScreen';
import StudentAnalyticsScreen from '../screens/StudentAnalyticsScreen';
import StudentTasksScreen from '../screens/StudentTasksScreen';
import StudentOnlineAssignmentsScreen from '../screens/StudentOnlineAssignmentsScreen';
import TeacherChapterViewerScreen from '../screens/TeacherChapterViewerScreen';
import LearnNavigator from './LearnNavigator';

// Import game screens
import OddOneOutScreen from '../screens/games/OddOneOutScreen';
import MemoryMatchScreen from '../screens/games/MemoryMatchScreen';
import QuickMathGame from '../screens/games/QuickMathGame';
import ChemistryBalanceGame from '../screens/games/ChemistryBalanceGame';
import ForcePlayGame from '../screens/games/ForcePlayGame';
import LabelOrganGame from '../screens/games/LabelOrganGame';
import CellStructureQuiz from '../screens/games/CellStructureQuiz';
import CellCommandScreen from '../screens/games/CellCommandScreen';
import DigestiveDashScreen from '../screens/games/DigestiveDashScreen';


// Import other screens
import SettingsScreenNew from '../screens/SettingsScreenNew';
import PrivacySecurityScreen from '../screens/PrivacySecurityScreen';
import RewardsScreen from '../screens/RewardsScreen';
import SyncScreen from '../screens/SyncScreen';
import TeacherDashboard from '../screens/TeacherDashboard';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import ScienceScreen from '../screens/ScienceScreen';
import QuizScreen from '../screens/QuizScreen';
import QuizResult from '../screens/QuizResult';
import ClassroomScreen from '../screens/ClassroomScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TabNavigator = () => {
    return (
        <Tab.Navigator
            tabBar={(props) => <CustomTabBar {...props} />}
            screenOptions={{
                headerShown: false,
            }}
        >
            <Tab.Screen name="HomeTab" component={HomeScreen} />
            <Tab.Screen name="Learn" component={LearnNavigator} />
            <Tab.Screen name="Tasks" component={StudentTasksScreen} />
            <Tab.Screen name="Games" component={GamesScreen} />
            <Tab.Screen name="Settings" component={SettingsScreenNew} />
        </Tab.Navigator>
    );
};

const MainNavigator = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="MainTabs" component={TabNavigator} />

            {/* Profile Screen - accessible from Settings */}
            <Stack.Screen name="Profile" component={ProfileScreen} />

            {/* Game Screens */}
            <Stack.Screen name="OddOneOut" component={OddOneOutScreen} />
            <Stack.Screen name="MemoryMatch" component={MemoryMatchScreen} />
            <Stack.Screen name="LabelOrganGame" component={LabelOrganGame} />
            <Stack.Screen name="QuickMathGame" component={QuickMathGame} />
            <Stack.Screen name="ChemistryBalanceGame" component={ChemistryBalanceGame} />
            <Stack.Screen name="CellStructureQuiz" component={CellStructureQuiz} />
            <Stack.Screen name="ForcePlayGame" component={ForcePlayGame} />
            <Stack.Screen name="CellCommand" component={CellCommandScreen} />
            <Stack.Screen name="DigestiveDash" component={DigestiveDashScreen} />


            {/* New Games */}

            <Stack.Screen name="TimeTravelDebug" component={require('../screens/games/TimeTravelDebugScreen').default} />
            <Stack.Screen name="GeneticsLab" component={require('../screens/games/GeneticsLabScreen').default} />



            {/* Other Screens */}
            <Stack.Screen name="PrivacySecurity" component={PrivacySecurityScreen} />
            <Stack.Screen name="Rewards" component={RewardsScreen} />
            <Stack.Screen name="Sync" component={SyncScreen} />
            <Stack.Screen name="TeacherDashboard" component={TeacherDashboard} />
            <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
            <Stack.Screen name="Science" component={ScienceScreen} />
            <Stack.Screen name="Quiz" component={QuizScreen} />
            <Stack.Screen name="QuizResult" component={QuizResult} />
            <Stack.Screen name="Notifications" component={NotificationScreen} />
            <Stack.Screen name="StudentAnalytics" component={StudentAnalyticsScreen} />
            <Stack.Screen name="StudentOnlineAssignments" component={StudentOnlineAssignmentsScreen} />
            <Stack.Screen name="TeacherChapterViewer" component={TeacherChapterViewerScreen} />
            <Stack.Screen name="CourseProgress" component={require('../screens/CourseProgressScreen').default} />

            <Stack.Screen name="Classroom" component={ClassroomScreen} />
            <Stack.Screen name="VideoLibrary" component={require('../screens/VideoLibraryScreen').default} />
            <Stack.Screen name="VideoPlayer" component={require('../screens/VideoPlayerScreen').default} />
            <Stack.Screen name="Chatbot" component={require('../screens/ChatbotScreen').default} />
            <Stack.Screen name="DigitalWellbeing" component={require('../screens/DigitalWellbeingScreen').default} />
            <Stack.Screen name="StudentFeedback" component={require('../screens/StudentFeedbackScreen').default} />
            <Stack.Screen name="TeacherFeedback" component={require('../screens/teacher/TeacherFeedbackScreen').default} />
        </Stack.Navigator>
    );
};

export default MainNavigator;
