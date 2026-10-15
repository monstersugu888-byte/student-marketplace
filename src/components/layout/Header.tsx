'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import {
  Search,
  Bell,
  Plus,
  Moon,
  Sun,
  GraduationCap,
  BookOpen,
  ShoppingBag,
  CheckCircle,
  FileText,
} from 'lucide-react';

interface HeaderProps {
  onOpenQuickAdd?: (type: 'assignment' | 'session' | 'task' | 'listing') => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenQuickAdd }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, unreadCount, theme, toggleTheme, notifications } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const query = encodeURIComponent(searchQuery.trim());
    if (pathname.includes('/materials')) {
      router.push(`/materials?q=${query}`);
    } else if (pathname.includes('/marketplace')) {
      router.push(`/marketplace?q=${query}`);
    } else if (pathname.includes('/assignments')) {
      router.push(`/assignments?q=${query}`);
    } else {
      router.push(`/assignments?q=${query}`);
    }
  };

  const getPageTitle = () => {
    if (pathname === '/') return 'Student Dashboard';
    if (pathname.startsWith('/assignments')) return 'Assignments Manager';
    if (pathname.startsWith('/timetable')) return 'Timetable & Calendar';
    if (pathname.startsWith('/attendance')) return 'Attendance Tracker';
    if (pathname.startsWith('/materials')) return 'Study Materials Library';
    if (pathname.startsWith('/marketplace')) return 'Student Marketplace';
    if (pathname.startsWith('/notifications')) return 'Notification Center';
    if (pathname.startsWith('/profile')) return 'Profile & Settings';
    if (pathname.startsWith('/auth')) return 'Authentication';
    return 'CampusMate';
  };

  return (
    <header className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
      {/* Page Title & Mobile Brand */}
      <div className="flex items-center gap-3">
        <div className="lg:hidden flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">
            <GraduationCap className="w-5 h-5" />
          </div>
        </div>
        <div>
          <h1 className="text-lg sm:text-xl font-heading font-bold text-slate-900 dark:text-white leading-tight">
            {getPageTitle()}
          </h1>
          <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400">
            Welcome back, <span className="font-semibold text-slate-700 dark:text-slate-200">{profile.name}</span>
          </p>
        </div>
      </div>

      {/* Search Bar & Cloud Sync & Quick Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        <form onSubmit={handleSearchSubmit} className="relative hidden lg:block w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search portal..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-primary/50 text-slate-900 dark:text-white placeholder-slate-400 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </form>

        {/* Quick Add Button with Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowQuickMenu(!showQuickMenu)}
            className="flex items-center gap-1.5 px-3 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-semibold shadow-sm transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Quick Add</span>
          </button>

          {showQuickMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 py-1.5 z-40 animate-fade-in">
              <button
                onClick={() => {
                  setShowQuickMenu(false);
                  onOpenQuickAdd?.('assignment');
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-slate-800 hover:text-primary transition-colors text-left font-medium"
              >
                <BookOpen className="w-4 h-4 text-primary" />
                <span>Add Assignment</span>
              </button>

              <button
                onClick={() => {
                  setShowQuickMenu(false);
                  onOpenQuickAdd?.('session');
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-slate-800 hover:text-primary transition-colors text-left font-medium"
              >
                <FileText className="w-4 h-4 text-emerald-500" />
                <span>Add Study Session</span>
              </button>

              <button
                onClick={() => {
                  setShowQuickMenu(false);
                  onOpenQuickAdd?.('task');
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-slate-800 hover:text-primary transition-colors text-left font-medium"
              >
                <CheckCircle className="w-4 h-4 text-indigo-500" />
                <span>Add Daily Task</span>
              </button>

              <button
                onClick={() => {
                  setShowQuickMenu(false);
                  onOpenQuickAdd?.('listing');
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-slate-800 hover:text-primary transition-colors text-left font-medium"
              >
                <ShoppingBag className="w-4 h-4 text-amber-500" />
                <span>Create Marketplace Item</span>
              </button>
            </div>
          )}
        </div>

        {/* Notifications Icon */}
        <div className="relative">
          <button
            onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
            className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>

          {showNotificationsDropdown && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 py-3 z-40 animate-fade-in">
              <div className="px-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h4 className="text-xs font-bold font-heading text-slate-900 dark:text-white uppercase tracking-wider">
                  Notifications
                </h4>
                <Link
                  href="/notifications"
                  onClick={() => setShowNotificationsDropdown(false)}
                  className="text-[11px] font-semibold text-primary hover:underline"
                >
                  View all
                </Link>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800/50">
                {notifications.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 text-xs transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                      !item.read ? 'bg-purple-50/50 dark:bg-purple-950/20' : ''
                    }`}
                  >
                    <div className="flex justify-between font-semibold text-slate-900 dark:text-slate-200">
                      <span>{item.title}</span>
                      <span className="text-[10px] text-slate-400 font-normal">{item.timestamp}</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{item.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Mobile Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-500" />}
        </button>

        {/* Profile Link */}
        <Link href="/profile" className="flex items-center gap-2">
          <img
            src={profile.avatar}
            alt={profile.name}
            className="w-8 h-8 rounded-full object-cover border border-purple-300 dark:border-purple-700"
          />
        </Link>
      </div>
    </header>
  );
};
