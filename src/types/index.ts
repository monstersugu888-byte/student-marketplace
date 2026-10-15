export type Priority = 'Low' | 'Medium' | 'High';
export type AssignmentStatus = 'Not Started' | 'In Progress' | 'Completed';

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  description: string;
  dueDate: string; // ISO date string or YYYY-MM-DD
  dueTime?: string;
  priority: Priority;
  status: AssignmentStatus;
  createdAt: string;
}

export interface ClassSchedule {
  id: string;
  title: string;
  subject: string;
  code: string;
  instructor: string;
  room: string;
  dayOfWeek: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  startTime: string; // e.g. "09:00"
  endTime: string;   // e.g. "10:30"
  color: string;     // Hex color or Tailwind class
}

export interface StudySession {
  id: string;
  title: string;
  subject: string;
  date: string;
  startTime: string;
  endTime: string;
  notes?: string;
  location?: string;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  status: 'Present' | 'Absent' | 'Cancelled';
  note?: string;
}

export interface SubjectAttendance {
  id: string;
  subject: string;
  code: string;
  instructor: string;
  attendedClasses: number;
  totalClasses: number;
  targetPercentage: number; // e.g. 75
  history: AttendanceRecord[];
}

export interface StudyMaterial {
  id: string;
  title: string;
  subject: string;
  courseCode: string;
  semester: string;
  type: 'PDF' | 'Notes' | 'Slides' | 'Lab Manual' | 'Link' | 'Image';
  content?: string;
  imageUrl?: string;
  storagePath?: string;
  fileSize?: string;
  uploadDate: string;
  uploadedBy: string;
  downloadUrl: string;
  downloadsCount: number;
  bookmarked?: boolean;
}

export type MarketplaceCategory = 'Books' | 'Electronics' | 'Stationery' | 'Lab Equipment' | 'Hostel Essentials' | 'Other';
export type ItemCondition = 'Brand New' | 'Like New' | 'Good' | 'Fair';
export type ListingStatus = 'Available' | 'Reserved' | 'Sold';

export interface MarketplaceListing {
  id: string;
  title: string;
  description: string;
  price: number;
  category: MarketplaceCategory;
  condition: ItemCondition;
  status: ListingStatus;
  imageUrl: string;
  sellerName: string;
  sellerAvatar: string;
  sellerContact: string;
  postedDate: string;
  location: string;
  isOwner?: boolean;
}

export type NotificationType = 'deadline' | 'schedule' | 'announcement' | 'marketplace' | 'attendance';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: NotificationType;
  read: boolean;
  link?: string;
}

export interface DailyTask {
  id: string;
  title: string;
  completed: boolean;
  category?: string;
}

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  college: string;
  major: string;
  semester: string;
  studentId: string;
  gpa: string;
  bio: string;
  notificationPreferences: {
    emailDeadlines: boolean;
    pushReminders: boolean;
    marketplaceAlerts: boolean;
    weeklyDigest: boolean;
  };
}
