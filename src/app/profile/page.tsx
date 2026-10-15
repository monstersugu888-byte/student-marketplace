'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useApp } from '@/context/AppContext';
import {
  User,
  GraduationCap,
  Mail,
  ShieldCheck,
  BellRing,
  Moon,
  Sun,
  LogOut,
  Edit2,
  Award,
  BookOpen,
  CheckCircle2,
  Trash2,
  Database,
  Cloud,
  RefreshCw
} from 'lucide-react';
import { Modal } from '@/components/common/Modal';

export default function ProfilePage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const {
    profile,
    updateProfile,
    theme,
    toggleTheme,
    logout,
    showToast,
    isCloudSyncing,
    lastSyncedAt,
    refreshFromCloud
  } = useApp();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [name, setName] = useState(profile.name);
  const [college, setCollege] = useState(profile.college);
  const [major, setMajor] = useState(profile.major);
  const [semester, setSemester] = useState(profile.semester);
  const [studentId, setStudentId] = useState(profile.studentId);
  const [avatar, setAvatar] = useState(profile.avatar);
  const [bio, setBio] = useState(profile.bio);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await updateProfile({ name, college, major, semester, studentId, avatar, bio });
      setIsEditOpen(false);
    } finally { setBusy(false); }
  };

  const toggleNotifPref = (key: keyof typeof profile.notificationPreferences) => {
    updateProfile({
      notificationPreferences: {
        ...profile.notificationPreferences,
        [key]: !profile.notificationPreferences[key],
      }
    });
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Profile Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-card flex flex-col sm:flex-row items-center sm:items-start gap-6 relative overflow-hidden">
        <div className="relative shrink-0">
          <img
            src={profile.avatar}
            alt={profile.name}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-primary shadow-md"
          />
        </div>

        <div className="space-y-2 text-center sm:text-left flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-slate-900 dark:text-white">
                {profile.name}
              </h2>
              <p className="text-xs text-primary font-bold">{profile.major}</p>
            </div>

            <button
              onClick={() => setIsEditOpen(true)}
              className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-primary hover:text-white text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
            {profile.bio}
          </p>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1 font-semibold">
              <GraduationCap className="w-4 h-4 text-purple-500" />
              {profile.college}
            </span>
            <span className="flex items-center gap-1 font-semibold">
              <BookOpen className="w-4 h-4 text-blue-500" />
              {profile.semester}
            </span>
            <span className="flex items-center gap-1 font-semibold">
              <Award className="w-4 h-4 text-amber-500" />
              GPA: {profile.gpa}
            </span>
          </div>
        </div>
      </div>

      {/* Cloud Firestore Backend Status Card */}
      <div className="bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-slate-900/40 border border-purple-500/30 rounded-2xl p-5 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-purple-600/20 text-purple-400 rounded-xl border border-purple-500/30">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                Supabase Backend Database
              </h4>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px] border border-emerald-500/30">
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Your account and marketplace listings are connected to Supabase. Other dashboard modules are still being migrated.
            </p>
          </div>
        </div>

        <button
          onClick={refreshFromCloud}
          disabled={isCloudSyncing}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold transition-all shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isCloudSyncing ? 'animate-spin' : ''}`} />
          <span>{isCloudSyncing ? 'Syncing...' : 'Sync Supabase'}</span>
        </button>
      </div>

      {/* Academic Details Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Academic Profile */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-card space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <GraduationCap className="w-5 h-5 text-primary" />
            <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
              Academic Profile
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-800">
              <span className="text-slate-500">Student ID:</span>
              <span className="font-bold text-slate-900 dark:text-white">{profile.studentId}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-800">
              <span className="text-slate-500">Campus Email:</span>
              <span className="font-bold text-slate-900 dark:text-white">{profile.email}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-800">
              <span className="text-slate-500">Current Semester:</span>
              <span className="font-bold text-slate-900 dark:text-white">{profile.semester}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-800">
              <span className="text-slate-500">Cumulative GPA:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{profile.gpa}</span>
            </div>
          </div>
        </div>

        {/* Appearance & Preferences */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-card space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <BellRing className="w-5 h-5 text-indigo-500" />
            <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
              Notifications & Theme
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            {/* Theme Toggle */}
            <div className="flex items-center justify-between py-1.5">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">Interface Theme</p>
                <p className="text-[11px] text-slate-500">Toggle between Light and Dark mode</p>
              </div>
              <button
                onClick={toggleTheme}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-slate-800 dark:text-slate-200"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
                <span>{theme === 'dark' ? 'Dark' : 'Light'}</span>
              </button>
            </div>

            {/* Notification Toggles */}
            <div className="flex items-center justify-between py-1.5 border-t border-slate-50 dark:border-slate-800">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">Email Deadline Alerts</p>
                <p className="text-[11px] text-slate-500">Receive reminders for upcoming assignments</p>
              </div>
              <input
                type="checkbox"
                checked={profile.notificationPreferences.emailDeadlines}
                onChange={() => toggleNotifPref('emailDeadlines')}
                className="w-4 h-4 accent-primary rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between py-1.5 border-t border-slate-50 dark:border-slate-800">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">Push Notifications</p>
                <p className="text-[11px] text-slate-500">Real-time schedule & room alerts</p>
              </div>
              <input
                type="checkbox"
                checked={profile.notificationPreferences.pushReminders}
                onChange={() => toggleNotifPref('pushReminders')}
                className="w-4 h-4 accent-primary rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Account Security & Danger Zone */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-card flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
            Account Management
          </h4>
          <p className="text-xs text-slate-500">
            Log out from current session or manage account credentials.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={async () => {
              if (!profile.email) { showToast('Your account email is missing. Sign in again.'); return; }
              setBusy(true);
              const { error } = await supabase.auth.resetPasswordForEmail(profile.email, { redirectTo: `${window.location.origin}/auth/reset-password` });
              setBusy(false);
              showToast(error ? `Password reset failed: ${error.message}` : `Password reset email sent to ${profile.email}. Check your inbox.`);
            }}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors"
          >
            Change Password
          </button>
          <button
            onClick={async () => {
              setBusy(true);
              try {
                await logout();
                localStorage.removeItem('cm_auth');
                localStorage.removeItem('cm_profile');
                router.replace('/auth/login');
              } catch (error) {
                showToast(error instanceof Error ? error.message : 'Could not log out. Please try again.');
              } finally { setBusy(false); }
            }}
            disabled={busy}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            <span>{busy ? 'Please wait…' : 'Log Out'}</span>
          </button>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Student Profile"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                College / School
              </label>
              <input
                type="text"
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Major / Degree Program
              </label>
              <input
                type="text"
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Current Semester
              </label>
              <input
                type="text"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Student ID Number
              </label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Avatar Image URL
            </label>
            <input
              type="text"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Bio / Tagline
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="px-5 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark"
            >
              {busy ? 'Saving…' : 'Save Profile'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
