'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import {
  LayoutDashboard,
  BookOpenCheck,
  GraduationCap,
  CalendarDays,
  UserCheck,
  FolderDown,
  ShoppingBag,
  User
} from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { name: 'Home', href: '/', icon: LayoutDashboard },
    { name: 'Tasks', href: '/assignments', icon: BookOpenCheck },
    { name: 'Academics', href: '/academics', icon: GraduationCap },
    { name: 'Schedule', href: '/timetable', icon: CalendarDays },
    { name: 'Attendance', href: '/attendance', icon: UserCheck },
    { name: 'Materials', href: '/materials', icon: FolderDown },
    { name: 'Store', href: '/marketplace', icon: ShoppingBag },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 flex items-center justify-around">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-colors ${
              isActive
                ? 'text-primary dark:text-purple-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 font-normal hover:text-slate-800'
            }`}
          >
            <div className="relative">
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-[10px]">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
};
