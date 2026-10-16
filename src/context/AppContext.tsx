'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Assignment,
  ClassSchedule,
  StudySession,
  StudyMaterial,
  MarketplaceListing,
  NotificationItem,
  DailyTask,
  StudentProfile,
  SubjectAttendance,
  AssignmentStatus,
  Priority
} from '../types';
import { supabase } from '../lib/supabase/client';
import { apiFetch } from '../lib/api-fetch';
import { initialProfile, initialClasses } from '../data/mockData';

interface AppContextType {
  // Auth state
  isAuthenticated: boolean;
  userRole: 'student' | 'teacher';
  login: (email: string, pass: string, name?: string) => Promise<boolean>;
  register: (email: string, pass: string, name: string, major?: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;

  // Cloud Sync state
  isCloudSyncing: boolean;
  lastSyncedAt: Date | null;
  refreshFromCloud: () => Promise<void>;

  // Profile
  profile: StudentProfile;
  updateProfile: (updated: Partial<StudentProfile>) => Promise<void>;

  // Attendance
  attendances: SubjectAttendance[];
  markAttendance: (subjectId: string, status: 'Present' | 'Absent' | 'Cancelled', date?: string, note?: string) => Promise<void>;
  addSubjectAttendance: (subject: string, code: string, instructor: string, attended: number, total: number, target?: number) => Promise<void>;
  updateSubjectAttendance: (id: string, attended: number, total: number, target?: number) => Promise<void>;
  deleteSubjectAttendance: (id: string) => Promise<void>;

  // Assignments
  assignments: Assignment[];
  addAssignment: (asg: Omit<Assignment, 'id' | 'createdAt'>) => Promise<void>;
  updateAssignment: (id: string, updated: Partial<Assignment>) => Promise<void>;
  deleteAssignment: (id: string) => Promise<void>;
  toggleAssignmentStatus: (id: string) => Promise<void>;

  // Classes & Study Sessions
  classes: ClassSchedule[];
  studySessions: StudySession[];
  addStudySession: (session: Omit<StudySession, 'id'>) => Promise<void>;
  deleteStudySession: (id: string) => Promise<void>;

  // Study Materials
  materials: StudyMaterial[];
  toggleBookmarkMaterial: (id: string) => Promise<void>;
  addMaterial: (mat: Omit<StudyMaterial, 'id' | 'downloadsCount' | 'uploadDate'>) => Promise<void>;

  // Marketplace
  listings: MarketplaceListing[];
  addListing: (item: Omit<MarketplaceListing, 'id' | 'postedDate' | 'sellerName' | 'sellerAvatar' | 'isOwner'>) => Promise<void>;
  updateListingStatus: (id: string, status: MarketplaceListing['status']) => Promise<void>;
  deleteListing: (id: string) => Promise<void>;

  // Daily Tasks
  dailyTasks: DailyTask[];
  addDailyTask: (title: string, category?: string) => Promise<void>;
  toggleDailyTask: (id: string) => Promise<void>;
  deleteDailyTask: (id: string) => Promise<void>;

  // Notifications
  notifications: NotificationItem[];
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  unreadCount: number;

  // Theme
  theme: 'light' | 'dark';
  toggleTheme: () => void;

  // Toast Feedback
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<'student' | 'teacher'>('student');
  const [profile, setProfile] = useState<StudentProfile>(initialProfile);
  const [attendances, setAttendances] = useState<SubjectAttendance[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes] = useState<ClassSchedule[]>(initialClasses);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Sync / Initialize authenticated user data in Supabase
  const syncUserFromCloud = useCallback(async (userEmail?: string, userName?: string) => {
    try {
      setIsCloudSyncing(true);
      const activeEmail = userEmail || 'student@example.com';
      const activeName = userName || 'Student';

      const res = await apiFetch('/api/init-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: activeEmail,
          email: activeEmail,
          name: activeName,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          const d = result.data;
          if (d.profile) setProfile(d.profile);
          if (d.assignments) setAssignments(d.assignments);
          if (d.attendances) setAttendances(d.attendances);
          if (d.dailyTasks) setDailyTasks(d.dailyTasks);
          if (d.studySessions) setStudySessions(d.studySessions);
          if (d.materials) setMaterials(d.materials);
          if (d.listings) setListings(d.listings);
          if (d.notifications) setNotifications(d.notifications);
          setLastSyncedAt(new Date());
        }
      }
    } catch (err) {
      console.warn('Backend sync fallback to local cache:', err);
    } finally {
      setIsCloudSyncing(false);
    }
  }, []);

  // Restore Supabase authentication and load marketplace listings.
  useEffect(() => {
    let active = true;
    let activeUserId: string | null = null;
    const clearPrivateState = () => {
      setIsAuthenticated(false);
      setUserRole('student');
      setProfile(initialProfile);
      setAssignments([]);
      setAttendances([]);
      setStudySessions([]);
      setMaterials([]);
      setNotifications([]);
      setDailyTasks([]);
      setListings([]);
      // Remove legacy per-user caches created by older versions. They are not
      // a source of truth and must not survive account switches on this device.
      ['cm_assignments', 'cm_attendances', 'cm_materials', 'cm_listings', 'cm_profile', 'cm_tasks', 'cm_sessions']
        .forEach(key => localStorage.removeItem(key));
    };
    const load = async () => {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (!active) return;
      if (sessionError) console.error('Supabase session error:', sessionError.message);
      const user = sessionData.session?.user;
      activeUserId = user?.id || null;
      if (!user) clearPrivateState();
      setIsAuthenticated(Boolean(user));
      setUserRole('student');
      if (user) {
        try {
          const roleResponse = await apiFetch('/api/profile', { cache: 'no-store' });
          const roleData = await roleResponse.json();
          if (active && roleResponse.ok) setUserRole(roleData.profile?.role === 'teacher' && roleData.profile?.teacherAccessStatus === 'approved' ? 'teacher' : 'student');
        } catch { /* Keep least-privilege student role if profile lookup fails. */ }
        await syncUserFromCloud(user.email || undefined, String(user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student'));
      }
      if (user) {
        setProfile(prev => ({
          ...prev,
          email: user.email || prev.email,
          name: String(user.user_metadata?.full_name || user.email?.split('@')[0] || prev.name),
          major: String(user.user_metadata?.major || prev.major),
        }));
      }
      if (user) {
        try {
          const listingsResponse = await apiFetch('/api/marketplace', { cache: 'no-store' });
          const listingsData = await listingsResponse.json();
          if (!active) return;
          if (!listingsResponse.ok) throw new Error(listingsData.error || 'Unable to load marketplace listings.');
          setListings((listingsData.listings || []).map((row: any) => ({
            id: row.id, title: row.title, description: row.description || '', price: Number(row.price || 0),
            category: row.category, condition: row.condition || 'Good', status: row.status || 'Available',
            imageUrl: row.imageUrl || '', postedDate: row.postedDate || '',
            sellerName: row.sellerName || 'Student seller', sellerAvatar: '',
            sellerContact: row.sellerContact || '', location: row.location || '', isOwner: Boolean(row.isOwner),
          })));
        } catch (error) {
          console.error('Marketplace API load error:', error);
        }
      }
    };
    load();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUserId = session?.user?.id || null;
      if (nextUserId !== activeUserId) {
        activeUserId = nextUserId;
        clearPrivateState();
      }
      setIsAuthenticated(Boolean(session));
      setUserRole('student');
      if (session?.user) {
        void apiFetch('/api/profile', { cache: 'no-store' }).then(async response => {
          const data = await response.json();
          setUserRole(response.ok && data.profile?.role === 'teacher' && data.profile?.teacherAccessStatus === 'approved' ? 'teacher' : 'student');
        }).catch(() => setUserRole('student'));
      }
    });
    const savedTheme = localStorage.getItem('cm_theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === 'dark') document.documentElement.classList.add('dark');
    }
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [syncUserFromCloud]);

  const refreshFromCloud = async () => {
    setIsCloudSyncing(true);
    try {
      const [{ data: authData, error: authError }, { data: rows, error: listingsError }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from('marketplace_listings').select('*').order('created_at', { ascending: false }),
      ]);
      if (authError) throw authError;
      if (listingsError) throw listingsError;
      const user = authData.user;
      setIsAuthenticated(Boolean(user));
      if (user) {
        setProfile(prev => ({
          ...prev,
          email: user.email || prev.email,
          name: String(user.user_metadata?.full_name || user.email?.split('@')[0] || prev.name),
          major: String(user.user_metadata?.major || prev.major),
        }));
      }
      setListings((rows || []).map((row: any) => ({
        id: row.id,
        title: row.title,
        description: row.description || '',
        price: Number(row.price),
        category: row.category,
        condition: row.item_condition,
        status: row.status === 'active' ? 'Available' : row.status === 'reserved' ? 'Reserved' : 'Sold',
        imageUrl: row.image_url || '',
        postedDate: new Date(row.created_at).toLocaleDateString(),
        sellerName: row.seller_name || 'Student seller',
        sellerAvatar: row.seller_avatar || '',
        sellerContact: row.seller_contact || '',
        location: row.location || '',
        isOwner: row.seller_id === user?.id,
      })));
      setLastSyncedAt(new Date());
      showToast('Synced profile and marketplace with Supabase.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Supabase sync failed.');
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const login = async (email: string, pass: string, name?: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) {
      showToast(error.message);
      return false;
    }
    setIsAuthenticated(true);
    setUserRole('student');
    try {
      const roleResponse = await apiFetch('/api/profile', { cache: 'no-store' });
      const roleData = await roleResponse.json();
      setUserRole(roleResponse.ok && roleData.profile?.role === 'teacher' && roleData.profile?.teacherAccessStatus === 'approved' ? 'teacher' : 'student');
    } catch { setUserRole('student'); }
    setProfile(prev => ({ ...prev, email, name: name || email.split('@')[0] }));
    await syncUserFromCloud(email, name || email.split('@')[0]);
    showToast('Signed in successfully');
    return true;
  };

  const register = async (email: string, pass: string, name: string, major?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: { full_name: name, major: major || 'Computer Science' },
        // Send confirmation emails to the deployed app, never the local development server.
        emailRedirectTo: 'https://student-marketplace-opal.vercel.app/auth/callback',
      },
    });
    if (error) return { success: false, message: error.message };
    if (!data.session) return { success: true, message: 'Account created. Check your email to confirm your account, then sign in.' };
    setIsAuthenticated(true);
    setUserRole('student');
    setProfile(prev => ({ ...prev, email, name, major: major || 'Computer Science' }));
    await syncUserFromCloud(email, name);
    return { success: true, message: 'Account created successfully.' };
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) throw error;
    setIsAuthenticated(false);
    setUserRole('student');
    showToast('Logged out successfully');
  };

  const updateProfile = async (updated: Partial<StudentProfile>) => {
    const newProfile = { ...profile, ...updated, avatar: '' };
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) { showToast('Please sign in before updating your profile.'); return; }
    try {
      const response = await apiFetch('/api/profile', {
        method: 'PUT',
        body: JSON.stringify({ updatedProfile: { ...updated, avatar: undefined } }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Profile update failed.');
      setProfile({ ...newProfile, ...(result.profile || {}), avatar: '' });
      await supabase.auth.updateUser({ data: { full_name: newProfile.name, major: newProfile.major } });
      showToast('Profile updated successfully.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Profile update failed.');
    }
  };

  // Attendance Handlers with Cloud Firestore
  const markAttendance = async (
    subjectId: string,
    status: 'Present' | 'Absent' | 'Cancelled',
    dateStr?: string,
    note?: string
  ) => {
    if (userRole !== 'teacher') {
      showToast('Only approved teachers can record attendance.');
      return;
    }
    if (status === 'Cancelled') {
      showToast('Cancelled classes do not change attendance totals.');
      return;
    }
    const date = dateStr || new Date().toISOString().slice(0, 10);
    try {
      const response = await apiFetch('/api/attendance', {
        method: 'PUT',
        body: JSON.stringify({ userId: profile.email, id: subjectId, action: 'mark', status, date, note }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.success === false) throw new Error(result.error || 'Attendance was not saved.');
      setAttendances(prev => prev.map(item => item.id === subjectId ? {
        ...item,
        attendedClasses: Number(result.updated?.attendedClasses ?? item.attendedClasses),
        totalClasses: Number(result.updated?.totalClasses ?? item.totalClasses),
        history: Array.isArray(result.updated?.history) ? result.updated.history : item.history,
      } : item));
      const saved = result.updated;
      const percentage = saved?.totalClasses ? Math.round((saved.attendedClasses / saved.totalClasses) * 100) : 0;
      showToast(`Marked ${status} in ${attendances.find(item => item.id === subjectId)?.subject || 'subject'} (${percentage}%).`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Attendance was not saved.');
    }
  };

  const addSubjectAttendance = async (
    subject: string,
    code: string,
    instructor: string,
    attended: number,
    total: number,
    target: number = 75
  ) => {
    if (userRole !== 'teacher') { showToast('Only approved teachers can create attendance subjects.'); return; }
    if (!subject.trim() || !code.trim() || attended < 0 || total < attended) {
      showToast('Enter a subject, code, and valid attendance totals.');
      return;
    }
    const newSub: SubjectAttendance = {
      id: 'att_' + Date.now(),
      subject: subject.trim(),
      code: code.trim(),
      instructor: instructor.trim() || 'Teacher',
      attendedClasses: attended,
      totalClasses: total,
      targetPercentage: Math.min(100, Math.max(1, target || 75)),
      history: [],
    };
    try {
      const response = await apiFetch('/api/attendance', {
        method: 'POST',
        body: JSON.stringify({ subject: newSub }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.success === false) throw new Error(result.error || 'Attendance subject could not be saved.');
      const saved = result.subject || newSub;
      setAttendances(prev => [...prev.filter(item => item.id !== saved.id), saved]);
      showToast(`Added ${subject} to attendance subjects.`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Attendance subject could not be saved.');
    }
  };

  const updateSubjectAttendance = async (
    id: string,
    attended: number,
    total: number,
    target?: number
  ) => {
    if (userRole !== 'teacher') { showToast('Only approved teachers can edit attendance.'); return; }
    if (!Number.isFinite(attended) || !Number.isFinite(total) || attended < 0 || total < attended) {
      showToast('Attendance totals are invalid.');
      return;
    }
    try {
      const response = await apiFetch('/api/attendance', {
        method: 'PUT',
        body: JSON.stringify({
          userId: profile.email,
          id,
          updated: { attendedClasses: attended, totalClasses: total, targetPercentage: target },
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.success === false) throw new Error(result.error || 'Attendance could not be updated.');
      setAttendances(prev => prev.map(item => item.id === id ? {
        ...item, attendedClasses: attended, totalClasses: total,
        targetPercentage: target ?? item.targetPercentage,
      } : item));
      showToast('Attendance counts saved.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Attendance could not be updated.');
    }
  };

  const deleteSubjectAttendance = async (id: string) => {
    if (userRole !== 'teacher') { showToast('Only approved teachers can delete attendance subjects.'); return; }
    try {
      const response = await apiFetch(`/api/attendance?userId=${encodeURIComponent(profile.email)}&id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.success === false) throw new Error(result.error || 'Attendance subject could not be deleted.');
      setAttendances(prev => prev.filter(item => item.id !== id));
      showToast('Attendance subject deleted.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Attendance subject could not be deleted.');
    }
  };

  // Assignments Handlers with Cloud Firestore
  const addAssignment = async (asg: Omit<Assignment, 'id' | 'createdAt'>) => {
    if (userRole !== 'teacher') { showToast('Only approved teachers can create assignments.'); return; }
    const newAsg: Assignment = {
      ...asg,
      id: 'asg_' + Date.now(),
      createdAt: new Date().toISOString().split('T')[0],
    };
    setAssignments(prev => [newAsg, ...prev]);
    showToast(`Assignment "${asg.title}" created & saved to Cloud ☁️`);

    try {
      const response = await apiFetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile.email,
          assignment: newAsg,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.success === false) throw new Error(result.error || 'Assignment could not be saved.');
    } catch (e) {
      setAssignments(prev => prev.filter(item => item.id !== newAsg.id));
      showToast(e instanceof Error ? e.message : 'Assignment could not be saved.');
    }
  };

  const updateAssignment = async (id: string, updated: Partial<Assignment>) => {
    try {
      const response = await apiFetch('/api/assignments', {
        method: 'PUT',
        body: JSON.stringify({ id, updated }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.success === false) throw new Error(result.error || 'Assignment could not be updated.');
      setAssignments(prev => prev.map(item => item.id === id ? { ...item, ...updated } : item));
      showToast('Assignment changes saved.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Assignment could not be updated.');
    }
  };

  const deleteAssignment = async (id: string) => {
    try {
      const response = await apiFetch(`/api/assignments?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.success === false) throw new Error(result.error || 'Assignment could not be deleted.');
      setAssignments(prev => prev.filter(item => item.id !== id));
      showToast('Assignment deleted.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Assignment could not be deleted.');
    }
  };

  const toggleAssignmentStatus = async (id: string) => {
    const assignment = assignments.find(item => item.id === id);
    if (!assignment) return;
    const nextStatus: AssignmentStatus = assignment.status === 'Completed' ? 'In Progress' : 'Completed';
    try {
      const response = await apiFetch('/api/assignments', {
        method: 'PUT',
        body: JSON.stringify({ id, updated: { status: nextStatus } }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.success === false) throw new Error(result.error || 'Assignment status could not be saved.');
      setAssignments(prev => prev.map(item => item.id === id ? { ...item, status: nextStatus } : item));
      showToast(nextStatus === 'Completed' ? `Marked "${assignment.title}" complete.` : `Reopened "${assignment.title}".`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Assignment status could not be saved.');
    }
  };

  // Study Sessions Handlers with Cloud Firestore
  const addStudySession = async (session: Omit<StudySession, 'id'>) => {
    const newSession: StudySession = {
      ...session,
      id: 'ses_' + Date.now(),
    };
    setStudySessions(prev => [...prev, newSession]);
    showToast(`Study session "${session.title}" scheduled & saved to Cloud ☁️`);

    try {
      await apiFetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile.email,
          session: newSession,
        }),
      });
    } catch (e) {
      console.error('Cloud addStudySession error:', e);
    }
  };

  const deleteStudySession = async (id: string) => {
    setStudySessions(prev => prev.filter(s => s.id !== id));
    showToast('Study session removed ☁️');

    try {
      await apiFetch(`/api/sessions?userId=${encodeURIComponent(profile.email)}&id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    } catch (e) {
      console.error('Cloud deleteStudySession error:', e);
    }
  };

  // Study Materials Handlers with Cloud Firestore
  const toggleBookmarkMaterial = async (id: string) => {
    let isBookmarked = false;
    setMaterials(prev => prev.map(m => {
      if (m.id === id) {
        isBookmarked = !m.bookmarked;
        showToast(isBookmarked ? 'Bookmarked material ☁️' : 'Removed from bookmarks ☁️');
        return { ...m, bookmarked: isBookmarked };
      }
      return m;
    }));

    try {
      await apiFetch('/api/materials', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile.email,
          id,
          bookmarked: isBookmarked,
        }),
      });
    } catch (e) {
      console.error('Cloud toggleBookmarkMaterial error:', e);
    }
  };

  const addMaterial = async (mat: Omit<StudyMaterial, 'id' | 'downloadsCount' | 'uploadDate'>) => {
    if (userRole !== 'teacher') throw new Error('Only approved teachers can upload study materials.');
    const newMat: StudyMaterial = {
      ...mat,
      id: 'mat_' + Date.now(),
      uploadDate: new Date().toISOString().split('T')[0],
      downloadsCount: 0,
      bookmarked: false,
    };
    const { data: authData } = await supabase.auth.getSession();
    const response = await apiFetch('/api/materials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(authData.session?.access_token ? { Authorization: `Bearer ${authData.session.access_token}` } : {}) },
      body: JSON.stringify({ userId: profile.email, material: newMat }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.success === false) {
      throw new Error(result.error || 'File uploaded, but saving its details failed. Please try again.');
    }
    setMaterials(prev => [newMat, ...prev]);
    showToast(`Study resource "${mat.title}" uploaded successfully.`);
  };

  // Marketplace Handlers with Cloud Firestore
  const addListing = async (item: Omit<MarketplaceListing, 'id' | 'postedDate' | 'sellerName' | 'sellerAvatar' | 'isOwner'>) => {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    const user = authData.user;
    if (authError || !user) {
      showToast('Please sign in before creating a listing.');
      return;
    }
    const payload = {
      seller_id: user.id,
      title: item.title,
      description: item.description,
      price: item.price,
      category: item.category,
      item_condition: item.condition,
      status: item.status === 'Reserved' ? 'reserved' : item.status === 'Sold' ? 'sold' : 'active',
      image_url: item.imageUrl,
      seller_name: profile.name,
      seller_avatar: profile.avatar,
      seller_contact: item.sellerContact,
      location: item.location,
    };
    const { data, error } = await supabase.from('marketplace_listings').insert(payload).select().single();
    if (error || !data) {
      showToast(error?.message || 'Could not create listing.');
      return;
    }
    const newListing: MarketplaceListing = {
      ...item,
      id: data.id,
      postedDate: 'Just now',
      sellerName: data.seller_name || profile.name,
      sellerAvatar: data.seller_avatar || profile.avatar,
      isOwner: true,
    };
    setListings(prev => [newListing, ...prev]);
    showToast(`Marketplace item "${item.title}" listed successfully.`);
  };

  const updateListingStatus = async (id: string, status: MarketplaceListing['status']) => {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      showToast('Please sign in to update your listing.');
      return;
    }
    const dbStatus = status === 'Reserved' ? 'reserved' : status === 'Sold' ? 'sold' : 'active';
    const { error } = await supabase.from('marketplace_listings').update({ status: dbStatus }).eq('id', id).eq('seller_id', authData.user.id);
    if (error) {
      showToast(error.message);
      return;
    }
    setListings(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    showToast(`Listing marked as ${status}.`);
  };

  const deleteListing = async (id: string) => {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      showToast('Please sign in to remove a listing.');
      return;
    }
    const { error } = await supabase.from('marketplace_listings').delete().eq('id', id).eq('seller_id', authData.user.id);
    if (error) {
      showToast(error.message);
      return;
    }
    setListings(prev => prev.filter(l => l.id !== id));
    showToast('Listing removed.');
  };

  // Daily Tasks Handlers with Cloud Firestore
  const addDailyTask = async (title: string, category: string = 'General') => {
    const newTask: DailyTask = {
      id: 'tsk_' + Date.now(),
      title,
      completed: false,
      category,
    };
    setDailyTasks(prev => [...prev, newTask]);
    showToast('Task added ☁️');

    try {
      await apiFetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile.email,
          task: newTask,
        }),
      });
    } catch (e) {
      console.error('Cloud addDailyTask error:', e);
    }
  };

  const toggleDailyTask = async (id: string) => {
    let completed = false;
    setDailyTasks(prev => prev.map(t => {
      if (t.id === id) {
        completed = !t.completed;
        return { ...t, completed };
      }
      return t;
    }));

    try {
      await apiFetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile.email,
          id,
          completed,
        }),
      });
    } catch (e) {
      console.error('Cloud toggleDailyTask error:', e);
    }
  };

  const deleteDailyTask = async (id: string) => {
    setDailyTasks(prev => prev.filter(t => t.id !== id));

    try {
      await apiFetch(`/api/tasks?userId=${encodeURIComponent(profile.email)}&id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    } catch (e) {
      console.error('Cloud deleteDailyTask error:', e);
    }
  };

  // Notifications Handlers with Cloud Firestore
  const markNotificationRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

    try {
      await apiFetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile.email,
          id,
        }),
      });
    } catch (e) {
      console.error('Cloud markNotificationRead error:', e);
    }
  };

  const markAllNotificationsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    showToast('All notifications marked as read ☁️');

    try {
      await apiFetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile.email,
          markAll: true,
        }),
      });
    } catch (e) {
      console.error('Cloud markAllNotificationsRead error:', e);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('cm_theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        userRole,
        login,
        register,
        logout,
        isCloudSyncing,
        lastSyncedAt,
        refreshFromCloud,
        profile,
        updateProfile,
        attendances,
        markAttendance,
        addSubjectAttendance,
        updateSubjectAttendance,
        deleteSubjectAttendance,
        assignments,
        addAssignment,
        updateAssignment,
        deleteAssignment,
        toggleAssignmentStatus,
        classes,
        studySessions,
        addStudySession,
        deleteStudySession,
        materials,
        toggleBookmarkMaterial,
        addMaterial,
        listings,
        addListing,
        updateListingStatus,
        deleteListing,
        dailyTasks,
        addDailyTask,
        toggleDailyTask,
        deleteDailyTask,
        notifications,
        markNotificationRead,
        markAllNotificationsRead,
        unreadCount,
        theme,
        toggleTheme,
        toastMessage,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
