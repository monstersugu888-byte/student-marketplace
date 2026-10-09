'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import {
  Sparkles,
  BookOpen,
  CalendarCheck,
  Award,
  ArrowUpRight,
  Clock
} from 'lucide-react';
import Link from 'next/link';

export const WelcomeBanner: React.FC = () => {
  const { profile, assignments, dailyTasks } = useApp();

  const pendingAssignments = assignments.filter(a => a.status !== 'Completed');
  const completedTasks = dailyTasks.filter(t => t.completed).length;
  const taskProgress = dailyTasks.length > 0 ? Math.round((completedTasks / dailyTasks.length) * 100) : 0;

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-600 p-6 sm:p-8 text-white shadow-xl shadow-purple-900/10">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 -mb-16 w-48 h-48 rounded-full bg-purple-400/20 blur-xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-purple-100">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{todayStr} • {profile.semester}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-heading font-extrabold tracking-tight">
            Welcome back, {profile.name}! 👋
          </h2>

          <p className="text-xs sm:text-sm text-purple-100/90 leading-relaxed">
            You have <strong className="text-white font-bold">{pendingAssignments.length} pending assignments</strong> and 
            today's classes are ready. Stay on top of your deadlines and study goals!
          </p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 shrink-0">
          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-3 sm:p-4 text-center">
            <div className="flex items-center justify-center text-purple-200 mb-1">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <p className="text-xl sm:text-2xl font-extrabold">{pendingAssignments.length}</p>
            <p className="text-[10px] sm:text-xs text-purple-200 font-medium">Pending Work</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-3 sm:p-4 text-center">
            <div className="flex items-center justify-center text-emerald-300 mb-1">
              <CalendarCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <p className="text-xl sm:text-2xl font-extrabold">{taskProgress}%</p>
            <p className="text-[10px] sm:text-xs text-purple-200 font-medium">Tasks Done</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-3 sm:p-4 text-center">
            <div className="flex items-center justify-center text-amber-300 mb-1">
              <Award className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <p className="text-xl sm:text-2xl font-extrabold">{profile.gpa.split(' ')[0]}</p>
            <p className="text-[10px] sm:text-xs text-purple-200 font-medium">Current GPA</p>
          </div>
        </div>
      </div>
    </div>
  );
};
