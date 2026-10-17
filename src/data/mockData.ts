import {
  Assignment,
  ClassSchedule,
  StudySession,
  StudyMaterial,
  MarketplaceListing,
  NotificationItem,
  DailyTask,
  StudentProfile,
  SubjectAttendance
} from '../types';

export const initialProfile: StudentProfile = {
  id: '',
  name: '',
  email: '',
  avatar: '',
  college: '',
  major: '',
  semester: '',
  studentId: '',
  gpa: '',
  bio: '',
  notificationPreferences: {
    emailDeadlines: true,
    pushReminders: true,
    marketplaceAlerts: false,
    weeklyDigest: true,
  }

};

export const initialAttendances: SubjectAttendance[] = [
  {
    id: 'att_1',
    subject: 'Operating Systems',
    code: 'CS301',
    instructor: 'Dr. Sarah Jenkins',
    attendedClasses: 21,
    totalClasses: 24,
    targetPercentage: 75,
    history: [
      { id: 'h1', date: '2026-10-06', status: 'Present' },
      { id: 'h2', date: '2026-10-04', status: 'Present' },
      { id: 'h3', date: '2026-09-29', status: 'Absent', note: 'Medical leave' },
      { id: 'h4', date: '2026-09-27', status: 'Present' },
    ]
  },
  {
    id: 'att_2',
    subject: 'Database Systems',
    code: 'CS304',
    instructor: 'Prof. Alan Turing',
    attendedClasses: 18,
    totalClasses: 20,
    targetPercentage: 75,
    history: [
      { id: 'h5', date: '2026-10-05', status: 'Present' },
      { id: 'h6', date: '2026-10-02', status: 'Present' },
      { id: 'h7', date: '2026-09-28', status: 'Present' },
    ]
  },
  {
    id: 'att_3',
    subject: 'Data Structures & Algorithms',
    code: 'CS202',
    instructor: 'Dr. Robert Tarjan',
    attendedClasses: 14,
    totalClasses: 18,
    targetPercentage: 75,
    history: [
      { id: 'h8', date: '2026-10-05', status: 'Present' },
      { id: 'h9', date: '2026-10-01', status: 'Absent', note: 'Campus Hackathon' },
    ]
  },
  {
    id: 'att_4',
    subject: 'Computer Networks',
    code: 'CS303',
    instructor: 'Dr. Vint Cerf',
    attendedClasses: 13,
    totalClasses: 17,
    targetPercentage: 75,
    history: [
      { id: 'h10', date: '2026-10-04', status: 'Present' },
      { id: 'h11', date: '2026-09-30', status: 'Present' },
    ]
  },
  {
    id: 'att_5',
    subject: 'Software Engineering',
    code: 'CS308',
    instructor: 'Prof. Grace Hopper',
    attendedClasses: 11,
    totalClasses: 16,
    targetPercentage: 75,
    history: [
      { id: 'h12', date: '2026-10-03', status: 'Absent' },
      { id: 'h13', date: '2026-09-26', status: 'Present' },
    ]
  }
];

export const initialAssignments: Assignment[] = [
  {
    id: 'asg_1',
    title: 'Operating Systems Kernel Lab 3',
    subject: 'Operating Systems (CS301)',
    description: 'Implement simple process scheduler using Round Robin algorithm with time quantum 4ms.',
    dueDate: '2026-10-12',
    dueTime: '23:59',
    priority: 'High',
    status: 'In Progress',
    createdAt: '2026-10-01',
  },
  {
    id: 'asg_2',
    title: 'Database Normalization & B-Tree Indexing Report',
    subject: 'Database Systems (CS304)',
    description: 'Solve problem set on 3NF, BCNF and calculate search time complexity for B+ Trees.',
    dueDate: '2026-10-10',
    dueTime: '17:00',
    priority: 'High',
    status: 'Not Started',
    createdAt: '2026-10-04',
  },
  {
    id: 'asg_3',
    title: 'Algorithm Design Analysis Problem Set 4',
    subject: 'Data Structures & Algorithms (CS202)',
    description: 'Dynamic programming solutions for 0/1 Knapsack and Longest Common Subsequence.',
    dueDate: '2026-10-15',
    dueTime: '23:59',
    priority: 'Medium',
    status: 'In Progress',
    createdAt: '2026-10-05',
  },
  {
    id: 'asg_4',
    title: 'Software Architecture Case Study',
    subject: 'Software Engineering (CS308)',
    description: 'Analyze microservices vs monolithic architecture for high-concurrency payment gateways.',
    dueDate: '2026-10-18',
    dueTime: '18:00',
    priority: 'Low',
    status: 'Not Started',
    createdAt: '2026-10-06',
  },
  {
    id: 'asg_5',
    title: 'Computer Networks Socket Programming Project',
    subject: 'Computer Networks (CS303)',
    description: 'Build a multi-client TCP chat server with encrypted messaging in Python/C++.',
    dueDate: '2026-10-08',
    dueTime: '23:59',
    priority: 'High',
    status: 'Completed',
    createdAt: '2026-09-25',
  },
  {
    id: 'asg_6',
    title: 'Linear Algebra Quiz 2 Prep Notes',
    subject: 'Applied Mathematics (MA201)',
    description: 'Review Eigenvalues, Eigenvectors, and Matrix Diagonalization formulas.',
    dueDate: '2026-10-07',
    dueTime: '10:00',
    priority: 'Medium',
    status: 'Completed',
    createdAt: '2026-10-02',
  }
];

export const initialClasses: ClassSchedule[] = [
  {
    id: 'cls_1',
    title: 'Operating Systems Lecture',
    subject: 'Operating Systems',
    code: 'CS301',
    instructor: 'Dr. Sarah Jenkins',
    room: 'Hall 302',
    dayOfWeek: 1, // Monday
    startTime: '09:00',
    endTime: '10:30',
    color: 'bg-purple-100 text-purple-800 border-purple-300',
  },
  {
    id: 'cls_2',
    title: 'Database Systems Lab',
    subject: 'Database Systems',
    code: 'CS304',
    instructor: 'Prof. Alan Turing',
    room: 'Lab 4B',
    dayOfWeek: 1, // Monday
    startTime: '11:00',
    endTime: '13:00',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  {
    id: 'cls_3',
    title: 'Algorithms & Data Structures',
    subject: 'Algorithms',
    code: 'CS202',
    instructor: 'Dr. Robert Tarjan',
    room: 'Auditorium A',
    dayOfWeek: 2, // Tuesday
    startTime: '10:00',
    endTime: '11:30',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  },
  {
    id: 'cls_4',
    title: 'Software Engineering Seminar',
    subject: 'Software Eng',
    code: 'CS308',
    instructor: 'Prof. Grace Hopper',
    room: 'Hall 201',
    dayOfWeek: 2, // Tuesday
    startTime: '14:00',
    endTime: '15:30',
    color: 'bg-amber-100 text-amber-800 border-amber-300',
  },
  {
    id: 'cls_5',
    title: 'Computer Networks Lecture',
    subject: 'Networks',
    code: 'CS303',
    instructor: 'Dr. Vint Cerf',
    room: 'Hall 105',
    dayOfWeek: 3, // Wednesday
    startTime: '09:00',
    endTime: '10:30',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
  {
    id: 'cls_6',
    title: 'Applied Mathematics Lecture',
    subject: 'Mathematics',
    code: 'MA201',
    instructor: 'Dr. Srinivasa Ramanujan',
    room: 'Hall 404',
    dayOfWeek: 4, // Thursday
    startTime: '11:30',
    endTime: '13:00',
    color: 'bg-rose-100 text-rose-800 border-rose-300',
  },
  {
    id: 'cls_7',
    title: 'Web Technologies Workshop',
    subject: 'Web Tech',
    code: 'CS310',
    instructor: 'Prof. Tim Berners-Lee',
    room: 'Mac Lab 2',
    dayOfWeek: 5, // Friday
    startTime: '14:00',
    endTime: '16:00',
    color: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  }
];

export const initialStudySessions: StudySession[] = [
  {
    id: 'ses_1',
    title: 'OS Midterm Group Review',
    subject: 'Operating Systems',
    date: '2026-10-10',
    startTime: '15:00',
    endTime: '17:00',
    notes: 'Campus Library Room 4. Reviewing Page Replacement algorithms & Memory Management.',
    location: 'Central Library Study Room 4',
  },
  {
    id: 'ses_2',
    title: 'Algorithms Coding Practice',
    subject: 'Data Structures',
    date: '2026-10-11',
    startTime: '19:00',
    endTime: '21:00',
    notes: 'Solving LeetCode graph problems (Dijkstra & Topological Sort)',
    location: 'Hostel Block B Lounge',
  }
];

export const initialStudyMaterials: StudyMaterial[] = [
  {
    id: 'mat_1',
    title: 'Operating Systems Concepts - Complete Lecture Notes',
    subject: 'Operating Systems',
    courseCode: 'CS301',
    semester: '5th Semester',
    type: 'PDF',
    fileSize: '4.2 MB',
    uploadDate: '2026-09-28',
    uploadedBy: 'Dr. Sarah Jenkins',
    downloadUrl: '#',
    downloadsCount: 142,
    bookmarked: true,
  },
  {
    id: 'mat_2',
    title: 'Database Schema Cheat Sheet & SQL Queries',
    subject: 'Database Systems',
    courseCode: 'CS304',
    semester: '5th Semester',
    type: 'PDF',
    fileSize: '1.8 MB',
    uploadDate: '2026-10-02',
    uploadedBy: 'Student Council',
    downloadUrl: '#',
    downloadsCount: 98,
    bookmarked: true,
  },
  {
    id: 'mat_3',
    title: 'B-Tree & B+ Tree Interactive Visualization Guide',
    subject: 'Database Systems',
    courseCode: 'CS304',
    semester: '5th Semester',
    type: 'Link',
    fileSize: 'External Web Resource',
    uploadDate: '2026-10-04',
    uploadedBy: 'Alex Rivera',
    downloadUrl: 'https://cs.usfca.edu/~galles/visualization/BTree.html',
    downloadsCount: 64,
    bookmarked: false,
  },
  {
    id: 'mat_4',
    title: 'Algorithm Complexity & Big-O Reference Sheet',
    subject: 'Data Structures & Algorithms',
    courseCode: 'CS202',
    semester: '4th Semester',
    type: 'Notes',
    fileSize: '950 KB',
    uploadDate: '2026-09-15',
    uploadedBy: 'Prof. Alan Turing',
    downloadUrl: '#',
    downloadsCount: 230,
    bookmarked: false,
  },
  {
    id: 'mat_5',
    title: 'Computer Networks TCP/IP Protocol Suite Slides',
    subject: 'Computer Networks',
    courseCode: 'CS303',
    semester: '5th Semester',
    type: 'Slides',
    fileSize: '8.5 MB',
    uploadDate: '2026-09-30',
    uploadedBy: 'Dr. Vint Cerf',
    downloadUrl: '#',
    downloadsCount: 115,
    bookmarked: false,
  },
  {
    id: 'mat_6',
    title: 'Linear Algebra Matrices & Vector Spaces Summary',
    subject: 'Applied Mathematics',
    courseCode: 'MA201',
    semester: '3rd Semester',
    type: 'PDF',
    fileSize: '2.1 MB',
    uploadDate: '2026-09-10',
    uploadedBy: 'Math Department',
    downloadUrl: '#',
    downloadsCount: 310,
    bookmarked: false,
  }
];

export const initialMarketplaceListings: MarketplaceListing[] = [];

export const initialNotifications: NotificationItem[] = [
  {
    id: 'notif_1',
    title: 'Assignment Deadline Approaching',
    message: 'Operating Systems Kernel Lab 3 is due in 3 days (Oct 12, 11:59 PM).',
    timestamp: '2 hours ago',
    type: 'deadline',
    read: false,
    link: '/assignments',
  },
  {
    id: 'notif_2',
    title: 'Class Room Change Alert',
    message: 'Operating Systems lecture on Monday moved to Auditorium B.',
    timestamp: '5 hours ago',
    type: 'schedule',
    read: false,
    link: '/timetable',
  },
  {
    id: 'notif_3',
    title: 'Campus Hackathon 2026 Registration Open',
    message: 'Annual 48-hour student hackathon. $10,000 prize pool. Register your team before Oct 20.',
    timestamp: '1 day ago',
    type: 'announcement',
    read: true,
  },
  {
    id: 'notif_4',
    title: 'Marketplace Inquiry',
    message: 'Someone interested in your TI-84 Calculator listing sent a contact request.',
    timestamp: '2 days ago',
    type: 'marketplace',
    read: true,
    link: '/marketplace',
  }
];

export const initialDailyTasks: DailyTask[] = [
  { id: 'tsk_1', title: 'Review Operating Systems process scheduling slides', completed: true, category: 'Study' },
  { id: 'tsk_2', title: 'Finish Database normalization practice exercises 1-5', completed: false, category: 'Homework' },
  { id: 'tsk_3', title: 'Return library book: Introduction to Distributed Systems', completed: false, category: 'Campus' },
  { id: 'tsk_4', title: 'Prepare questions for Algorithms office hours', completed: true, category: 'Study' },
];
