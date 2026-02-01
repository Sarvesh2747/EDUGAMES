import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TeacherHomeScreen from '../screens/teacher/TeacherHomeScreen';
import StudentListScreen from '../screens/teacher/StudentListScreen';
import CreateStudentScreen from '../screens/teacher/CreateStudentScreen';
import EditStudentScreen from '../screens/teacher/EditStudentScreen';
import ChapterAssignScreen from '../screens/teacher/ChapterAssignScreen';
import TeacherContentManagerScreen from '../screens/teacher/TeacherContentManagerScreen';
import TeacherQuizCreatorScreen from '../screens/teacher/TeacherQuizCreatorScreen';
import TeacherApprovalsScreen from '../screens/TeacherApprovalsScreen';
import NotificationScreen from '../screens/NotificationScreen';
import StudentAnalyticsScreen from '../screens/teacher/StudentAnalyticsScreen';;
import TeacherAnalyticsScreen from '../screens/teacher/TeacherAnalyticsScreen';
import TeacherClassroomScreen from '../screens/teacher/TeacherClassroomScreen';
import QuizScreen from '../screens/QuizScreen';
import QuizResult from '../screens/QuizResult';
import TeacherChapterViewerScreen from '../screens/TeacherChapterViewerScreen';
import TeacherGameAnalyticsScreen from '../screens/teacher/TeacherGameAnalyticsScreen';
import TeacherSendNotificationScreen from '../screens/teacher/TeacherSendNotificationScreen';

const Stack = createNativeStackNavigator();

const TeacherNavigator = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="TeacherHome" component={TeacherHomeScreen} />
            <Stack.Screen name="TeacherClassroomList" component={require('../screens/teacher/TeacherClassroomListScreen').default} />
            <Stack.Screen name="StudentList" component={StudentListScreen} />
            <Stack.Screen name="CreateStudent" component={CreateStudentScreen} />
            <Stack.Screen name="EditStudent" component={EditStudentScreen} />
            <Stack.Screen name="ChapterAssign" component={ChapterAssignScreen} />
            <Stack.Screen name="TeacherContentManager" component={TeacherContentManagerScreen} />
            <Stack.Screen name="TeacherQuizCreator" component={TeacherQuizCreatorScreen} />
            <Stack.Screen name="TeacherApprovals" component={TeacherApprovalsScreen} />
            <Stack.Screen name="Notifications" component={NotificationScreen} />
            <Stack.Screen name="StudentAnalytics" component={StudentAnalyticsScreen} />
            <Stack.Screen name="TeacherAnalytics" component={TeacherAnalyticsScreen} />
            <Stack.Screen name="TeacherClassroom" component={TeacherClassroomScreen} />
            <Stack.Screen name="Quiz" component={QuizScreen} />
            <Stack.Screen name="QuizResult" component={QuizResult} />
            <Stack.Screen name="TeacherChapterViewer" component={TeacherChapterViewerScreen} />
            <Stack.Screen name="TeacherGameAnalytics" component={TeacherGameAnalyticsScreen} />
            <Stack.Screen name="TeacherVideoManager" component={require('../screens/teacher/TeacherVideoManagerScreen').default} />
            <Stack.Screen name="TeacherWellbeing" component={require('../screens/teacher/TeacherWellbeingScreen').default} />
            <Stack.Screen name="TeacherFeedback" component={require('../screens/teacher/TeacherFeedbackScreen').default} />
            <Stack.Screen name="TeacherSendNotification" component={TeacherSendNotificationScreen} />
            <Stack.Screen name="LiveClassRoom" component={require('../screens/LiveClassRoomScreen').default} />
        </Stack.Navigator>
    );
};

export default TeacherNavigator;
