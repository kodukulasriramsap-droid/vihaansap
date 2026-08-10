import { Course, LiveClass, RecordedClass, StudyMaterial, DoubtTicket, Notification, AvailableCourse } from '../types';

export const MOCK_USER = {
  id: 'u-1',
  name: 'Student User',
  email: 'student@example.com',
  role: 'student' as const,
  avatar: 'https://ui-avatars.com/api/?name=Student+User&background=1763B6&color=fff'
};

export const MOCK_COURSES: Course[] = [];

export const MOCK_LIVE_CLASSES: LiveClass[] = [];

export const MOCK_RECORDINGS: RecordedClass[] = [];

export const MOCK_MATERIALS: StudyMaterial[] = [];

export const MOCK_DOUBTS: DoubtTicket[] = [];

export const MOCK_NOTIFICATIONS: Notification[] = [];

export const MOCK_AVAILABLE_COURSES: AvailableCourse[] = [];
