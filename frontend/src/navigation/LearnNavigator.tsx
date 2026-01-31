import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform } from 'react-native';
import LearnDashboardScreen from '../screens/Learn/LearnDashboardScreen';
import ClassSelectionScreen from '../screens/Learn/ClassSelectionScreen';
import SubjectSelectionScreen from '../screens/Learn/SubjectSelectionScreen';
import ChapterListScreen from '../screens/Learn/ChapterListScreen';
import SubchapterListScreen from '../screens/Learn/SubchapterListScreen';
import SubchapterScreen from '../screens/Learn/SubchapterScreen';
import SubchapterQuizScreen from '../screens/Learn/SubchapterQuizScreen';
import SimulationListScreen from '../screens/Learn/SimulationListScreen';
import QuizScreen from '../screens/QuizScreen';
import LessonReaderScreen from '../screens/Learn/LessonReaderScreen';
import ModelListScreen from '../screens/ModelListScreen';
import MobileModelListScreen from '../screens/MobileModelListScreen';
import ThreeDModelScreen from '../screens/ThreeDModelScreen';
import Mobile3DViewer from '../screens/Mobile3DViewer';
import { useResponsive } from '../hooks/useResponsive';
import GravityMapScreen from '../screens/Learn/GravityMapScreen';
import ElectricityMapScreen from '../screens/Learn/ElectricityMapScreen';

const Stack = createNativeStackNavigator();

const LearnNavigator = () => {
    const { isMobile } = useResponsive();

    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
            }}
            initialRouteName="LearnDashboard"
        >
            <Stack.Screen name="LearnDashboard" component={LearnDashboardScreen} />
            <Stack.Screen name="ClassSelection" component={ClassSelectionScreen} />
            <Stack.Screen name="SubjectSelection" component={SubjectSelectionScreen} />
            <Stack.Screen name="ChapterList" component={ChapterListScreen} />
            <Stack.Screen name="SubchapterList" component={SubchapterListScreen} />
            <Stack.Screen name="Subchapter" component={SubchapterScreen} />
            <Stack.Screen name="SubchapterQuiz" component={SubchapterQuizScreen} />
            <Stack.Screen name="SimulationList" component={SimulationListScreen} />
            <Stack.Screen name="Quiz" component={QuizScreen} />
            <Stack.Screen name="LessonReader" component={LessonReaderScreen} />
            <Stack.Screen
                name="ModelList"
                component={isMobile ? MobileModelListScreen : ModelListScreen}
            />
            <Stack.Screen
                name="ThreeDModel"
                component={Platform.OS === 'web' ? ThreeDModelScreen : Mobile3DViewer}
            />
            <Stack.Screen name="GravityMap" component={GravityMapScreen} />
            <Stack.Screen name="ElectricityMap" component={ElectricityMapScreen} />
        </Stack.Navigator>
    );
};

export default LearnNavigator;
