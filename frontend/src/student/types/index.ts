export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student';
  avatar?: string;
}

export interface Course {
  id: string;
  title: string;
  mentor: string;
  progress: number;
  status: 'active' | 'completed';
  thumbnail: string;
}

export interface LiveClass {
  id: string;
  title: string;
  date: string;
  time: string;
  mentor: string;
  status: 'upcoming' | 'live' | 'completed';
  link: string;
}

export interface RecordedClass {
  id: string;
  title: string;
  course: string;
  date: string;
  link: string;
}

export interface StudyMaterial {
  id: string;
  title: string;
  course: string;
  type: 'PDF' | 'PPT' | 'DOC' | 'Excel';
  link: string;
}

export interface DoubtTicket {
  id: string;
  course: string;
  topic: string;
  question: string;
  status: 'Pending' | 'Answered' | 'Closed';
}

export interface Notification {
  id: string;
  title: string;
  type: 'Recording Uploaded' | 'Material Uploaded' | 'Class Reminder' | 'Course Update' | 'Placement Update';
  date: string;
}

export interface AvailableCourse {
  id: string;
  title: string;
  description: string;
  image: string;
}
