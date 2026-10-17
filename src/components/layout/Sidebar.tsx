'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import {
  LayoutDashboard,
  BookOpenCheck,
  GraduationCap,
  CalendarDays,
  UserCheck,
  FolderDown,
  ShoppingBag,
  Bell,
  User,
  LogOut,
  Moon,
  Sun,
  ChevronRight
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, unreadCount, theme, toggleTheme, logout } = useApp();

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Assignments', href: '/assignments', icon: BookOpenCheck },
    { name: 'Academic Portal', href: '/academics', icon: GraduationCap },
    { name: 'Timetable & Calendar', href: '/timetable', icon: CalendarDays },
    { name: 'Attendance Tracker', href: '/attendance', icon: UserCheck },
    { name: 'Study Materials', href: '/materials', icon: FolderDown },
    { name: 'Student Marketplace', href: '/marketplace', icon: ShoppingBag },
    {
      name: 'Notifications',
      href: '/notifications',
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : undefined
    },
    { name: 'Profile & Settings', href: '/profile', icon: User },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 min-h-screen sticky top-0 shrink-0 select-none z-30">
      {/* Brand Header: client-side navigation avoids a full page reload */}
      <button
        type="button"
        onClick={() => router.push('/')}
        aria-label="Go to CampusMate dashboard"
        className="w-full text-left p-5 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-700 via-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
          <GraduationCap className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-heading font-extrabold text-lg text-slate-900 dark:text-white leading-tight">
            Campus<span className="text-primary">Mate</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Student Portal</p>
        </div>
      </button>

      {/* Main Navigation Links */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Main Menu
        </div>

        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                isActive
                  ? 'bg-primary-50 text-primary dark:bg-primary-900/30 dark:text-purple-300 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${
                  isActive ? 'text-primary dark:text-purple-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                }`} />
                <span>{item.name}</span>
              </div>
              {item.badge ? (
                <span className="px-2 py-0.5 text-xs font-bold bg-primary text-white rounded-full">
                  {item.badge}
                </span>
              ) : (
                isActive && <ChevronRight className="w-4 h-4 text-primary dark:text-purple-400 opacity-60" />
              )}
            </Link>
          );
        })}
      </div>

      {/* Theme Toggle & Quick User Info Footer */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-500" />
            )}
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
            {theme === 'dark' ? 'DARK' : 'LIGHT'}
          </span>
        </button>

        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <Link href="/profile" className="flex items-center gap-2.5 overflow-hidden group">
            <img
              src={profile.avatar}
              alt={profile.name}
              className="w-9 h-9 rounded-full object-cover border border-purple-200 dark:border-purple-800 shrink-0"
            />
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors">
                {profile.name}
              </p>
              <p className="text-[11px] text-slate-500 truncate">{profile.semester}</p>
            </div>
          </Link>
          <button
            onClick={logout}
            title="Log out"
            className="p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
