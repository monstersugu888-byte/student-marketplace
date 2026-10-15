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
import {
  initialProfile,
  initialAssignments,
  initialClasses,
  initialStudySessions,
  initialStudyMaterials,
  initialMarketplaceListings,
  initialNotifications,
  initialDailyTasks,
  initialAttendances
} from '../data/mockData';

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
  const [attendances, setAttendances] = useState<SubjectAttendance[]>(initialAttendances);
  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments);
  const [classes] = useState<ClassSchedule[]>(initialClasses);
  const [studySessions, setStudySessions] = useState<StudySession[]>(initialStudySessions);
  const [materials, setMaterials] = useState<StudyMaterial[]>(initialStudyMaterials);
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>(initialDailyTasks);
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

  // Sync / Initialize User in Cloud Firestore
  const syncUserFromCloud = useCallback(async (userEmail?: string, userName?: string) => {
    try {
      setIsCloudSyncing(true);
      const activeEmail = userEmail || profile.email || 'alex.rivera@campus.edu';
      const activeName = userName || profile.name || 'Alex Rivera';

      const res = await fetch('/api/init-user', {
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
  }, [profile.email, profile.name]);

  // Restore Supabase authentication and load marketplace listings.
  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (!active) return;
      if (sessionError) console.error('Supabase session error:', sessionError.message);
      const user = sessionData.session?.user;
      setIsAuthenticated(Boolean(user));
      setUserRole(user?.app_metadata?.role === 'teacher' ? 'teacher' : 'student');
      setUserRole(user?.app_metadata?.role === 'teacher' ? 'teacher' : 'student');
      if (user) {
        setProfile(prev => ({
          ...prev,
          email: user.email || prev.email,
          name: String(user.user_metadata?.full_name || user.email?.split('@')[0] || prev.name),
          major: String(user.user_metadata?.major || prev.major),
        }));
      }
      const { data, error } = await supabase.from('marketplace_listings').select('*').order('created_at', { ascending: false });
      if (!active) return;
      if (error) {
        console.error('Supabase listings load error:', error.message);
      } else if (data) {
        setListings(data.map((row: any) => ({
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
      }
    };
    load();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(Boolean(session));
      setUserRole(session?.user?.app_metadata?.role === 'teacher' ? 'teacher' : 'student');
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
  }, []);

  // Save to LocalStorage cache
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cm_assignments', JSON.stringify(assignments));
      localStorage.setItem('cm_attendances', JSON.stringify(attendances));
      localStorage.setItem('cm_materials', JSON.stringify(materials));
      localStorage.setItem('cm_listings', JSON.stringify(listings));
      localStorage.setItem('cm_profile', JSON.stringify(profile));
      localStorage.setItem('cm_tasks', JSON.stringify(dailyTasks));
      localStorage.setItem('cm_sessions', JSON.stringify(studySessions));
    }
  }, [assignments, attendances, materials, listings, profile, dailyTasks, studySessions]);

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
    const { data: sessionData } = await supabase.auth.getUser();
    setUserRole(sessionData.user?.app_metadata?.role === 'teacher' ? 'teacher' : 'student');
    setProfile(prev => ({ ...prev, email, name: name || email.split('@')[0] }));
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
        emailRedirectTo: `${(process.env.NEXT_PUBLIC_SITE_URL || 'https://student-marketplace-opal.vercel.app').replace(/\/$/, '')}/`,
      },
    });
    if (error) return { success: false, message: error.message };
    if (!data.session) return { success: true, message: 'Account created. Check your email to confirm your account, then sign in.' };
    setIsAuthenticated(true);
    setUserRole('student');
    setProfile(prev => ({ ...prev, email, name, major: major || 'Computer Science' }));
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
    const newProfile = { ...profile, ...updated };
    setProfile(newProfile);
    localStorage.setItem('cm_profile', JSON.stringify(newProfile));
    const { data: authData } = await supabase.auth.getUser();
    if (authData.user) {
      const { error: metadataError } = await supabase.auth.updateUser({
        data: { full_name: newProfile.name, major: newProfile.major, college: newProfile.college, semester: newProfile.semester, student_id: newProfile.studentId, avatar: newProfile.avatar, bio: newProfile.bio },
      });
      if (metadataError) showToast('Profile saved locally; cloud profile update failed: ' + metadataError.message);
      else showToast('Profile updated successfully');
    } else {
      showToast('Profile updated on this device');
    }

  };

  // Attendance Handlers with Cloud Firestore
  const markAttendance = async (
    subjectId: string,
    status: 'Present' | 'Absent' | 'Cancelled',
    dateStr?: string,
    note?: string
  ) => {
    const todayStr = dateStr || new Date().toISOString().split('T')[0];

    setAttendances(prev => prev.map(item => {
      if (item.id === subjectId) {
        const newHistoryItem = { id: 'h_' + Date.now(), date: todayStr, status, note };
        let newAttended = item.attendedClasses;
        let newTotal = item.totalClasses;

        if (status === 'Present') {
          newAttended += 1;
          newTotal += 1;
        } else if (status === 'Absent') {
          newTotal += 1;
        }

        const pct = Math.round((newAttended / (newTotal || 1)) * 100);
        showToast(
          status === 'Present'
            ? `Marked Present in ${item.subject} (${pct}%) ☁️`
            : status === 'Absent'
            ? `Marked Absent in ${item.subject} (${pct}%) ☁️`
            : `Class Cancelled for ${item.subject} ☁️`
        );

        return {
          ...item,
          attendedClasses: newAttended,
          totalClasses: newTotal,
          history: [newHistoryItem, ...item.history],
        };
      }
      return item;
    }));

    try {
      await fetch('/api/attendance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile.email,
          id: subjectId,
          action: 'mark',
          status,
          date: todayStr,
          note,
        }),
      });
    } catch (e) {
      console.error('Cloud markAttendance error:', e);
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
    const newSub: SubjectAttendance = {
      id: 'att_' + Date.now(),
      subject,
      code,
      instructor,
      attendedClasses: attended,
      totalClasses: total,
      targetPercentage: target,
      history: [],
    };
    setAttendances(prev => [...prev, newSub]);
    showToast(`Added ${subject} to Attendance Tracker ☁️`);

    try {
      await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile.email,
          subject: newSub,
        }),
      });
    } catch (e) {
      console.error('Cloud addSubjectAttendance error:', e);
    }
  };

  const updateSubjectAttendance = async (
    id: string,
    attended: number,
    total: number,
    target?: number
  ) => {
    setAttendances(prev => prev.map(a => {
      if (a.id === id) {
        return {
          ...a,
          attendedClasses: attended,
          totalClasses: total,
          targetPercentage: target ?? a.targetPercentage,
        };
      }
      return a;
    }));
    showToast('Attendance counts updated ☁️');

    try {
      await fetch('/api/attendance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile.email,
          id,
          updated: {
            attendedClasses: attended,
            totalClasses: total,
            targetPercentage: target,
          },
        }),
      });
    } catch (e) {
      console.error('Cloud updateSubjectAttendance error:', e);
    }
  };

  const deleteSubjectAttendance = async (id: string) => {
    setAttendances(prev => prev.filter(a => a.id !== id));
    showToast('Subject removed from Attendance Tracker ☁️');

    try {
      await fetch(`/api/attendance?userId=${encodeURIComponent(profile.email)}&id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    } catch (e) {
      console.error('Cloud deleteSubjectAttendance error:', e);
    }
  };

  // Assignments Handlers with Cloud Firestore
  const addAssignment = async (asg: Omit<Assignment, 'id' | 'createdAt'>) => {
    const newAsg: Assignment = {
      ...asg,
      id: 'asg_' + Date.now(),
      createdAt: new Date().toISOString().split('T')[0],
    };
    setAssignments(prev => [newAsg, ...prev]);
    showToast(`Assignment "${asg.title}" created & saved to Cloud ☁️`);

    try {
      await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile.email,
          assignment: newAsg,
        }),
      });
    } catch (e) {
      console.error('Cloud addAssignment error:', e);
    }
  };

  const updateAssignment = async (id: string, updated: Partial<Assignment>) => {
    setAssignments(prev => prev.map(a => a.id === id ? { ...a, ...updated } : a));
    showToast('Assignment updated ☁️');

    try {
      await fetch('/api/assignments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile.email,
          id,
          updated,
        }),
      });
    } catch (e) {
      console.error('Cloud updateAssignment error:', e);
    }
  };

  const deleteAssignment = async (id: string) => {
    setAssignments(prev => prev.filter(a => a.id !== id));
    showToast('Assignment deleted ☁️');

    try {
      await fetch(`/api/assignments?userId=${encodeURIComponent(profile.email)}&id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    } catch (e) {
      console.error('Cloud deleteAssignment error:', e);
    }
  };

  const toggleAssignmentStatus = async (id: string) => {
    let nextStatus: AssignmentStatus = 'Completed';
    setAssignments(prev => prev.map(a => {
      if (a.id === id) {
        nextStatus = a.status === 'Completed' ? 'In Progress' : 'Completed';
        showToast(
          nextStatus === 'Completed'
            ? `🎉 Marked "${a.title}" as completed! ☁️`
            : `Updated "${a.title}" status ☁️`
        );
        return { ...a, status: nextStatus };
      }
      return a;
    }));

    try {
      await fetch('/api/assignments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile.email,
          id,
          updated: { status: nextStatus },
        }),
      });
    } catch (e) {
      console.error('Cloud toggleAssignmentStatus error:', e);
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
      await fetch('/api/sessions', {
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
      await fetch(`/api/sessions?userId=${encodeURIComponent(profile.email)}&id=${encodeURIComponent(id)}`, {
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
      await fetch('/api/materials', {
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
    const newMat: StudyMaterial = {
      ...mat,
      id: 'mat_' + Date.now(),
      uploadDate: new Date().toISOString().split('T')[0],
      downloadsCount: 1,
      bookmarked: false,
    };
    setMaterials(prev => [newMat, ...prev]);
    showToast(`Study resource "${mat.title}" uploaded to Cloud ☁️`);

    try {
      await fetch('/api/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile.email,
          material: newMat,
        }),
      });
    } catch (e) {
      console.error('Cloud addMaterial error:', e);
    }
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
      await fetch('/api/tasks', {
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
      await fetch('/api/tasks', {
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
      await fetch(`/api/tasks?userId=${encodeURIComponent(profile.email)}&id=${encodeURIComponent(id)}`, {
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
      await fetch('/api/notifications', {
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
      await fetch('/api/notifications', {
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
