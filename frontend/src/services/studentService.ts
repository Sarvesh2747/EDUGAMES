import api from './api';

export interface ClassroomItem {
    id: string;
    type: 'chapter' | 'quiz';
    title: string;
    subtitle: string;
    description: string;
    fullContent?: string;
    teacher: string;
    date: string;
    icon: string;
    status?: 'pending' | 'completed';
    questions?: any[];
}

export interface Teacher {
    id: string;
    name: string;
    subject: string;
    avatar: string;
}

export interface ClassroomMeta {
    className: string;
    schoolName: string;
    teachers: Teacher[];
}

export interface ClassroomResponse {
    meta: ClassroomMeta;
    content: ClassroomItem[];
}

export interface ClassroomListItem {
    id: string;
    subject: string;
    className: string;
    teacher: string;
    teacherAvatar: string;
    itemCount: number;
    startColor: string;
}

export const fetchClassroomContent = async (subject?: string): Promise<ClassroomResponse> => {
    try {
        const url = subject
            ? `/student/classroom?subject=${encodeURIComponent(subject)}`
            : '/student/classroom';

        const response = await api.get(url);
        // Handle backward compatibility if response is just an array
        if (Array.isArray(response.data)) {
            return {
                meta: { className: 'Class', schoolName: '', teachers: [] },
                content: response.data
            };
        }
        return response.data;
    } catch (error) {
        console.error('Error fetching classroom content:', error);
        throw error;
    }
};

export const fetchClassroomsList = async (): Promise<ClassroomListItem[]> => {
    try {
        const response = await api.get('/student/classrooms-list');
        return response.data;
    } catch (error) {
        console.error('Error fetching classrooms list:', error);
        throw error;
    }
};

export interface LiveClassItem {
    _id: string;
    topic: string;
    startAt: string;
    duration: number;
    status: 'scheduled' | 'live' | 'completed';
    roomId: string;
    teacherId: string;
    teacherName?: string;
}

export const fetchStudentLiveClasses = async (subject?: string): Promise<LiveClassItem[]> => {
    try {
        const url = subject
            ? `/student/live-classes?subject=${encodeURIComponent(subject)}`
            : '/student/live-classes';

        const response = await api.get(url);
        return response.data;
    } catch (error) {
        console.error('Error fetching student live classes:', error);
        return []; // Return empty array on error to prevent UI crash
    }
};
