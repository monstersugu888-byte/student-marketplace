'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { Clock, MapPin, UserCheck, ArrowRight, Calendar } from 'lucide-react';

export const TodaySchedule: React.FC = () => {
  const { classes } = useApp();

  // Get current day of week (0=Sunday, 1=Monday, etc.)
  const todayDay = new Date().getDay();
  // Filter classes for today (or fallback to Monday if weekend)
  const dayToUse = todayDay === 0 || todayDay === 6 ? 1 : todayDay;
  const todaysClasses = classes.filter(c => c.dayOfWeek === dayToUse);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
            Today's Timetable
          </h3>
        </div>
        <Link
          href="/timetable"
          className="text-xs font-bold text-primary hover:text-primary-dark flex items-center gap-1 transition-colors"
        >
          <span>Full Schedule</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {todaysClasses.length === 0 ? (
        <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs">
          No classes scheduled for today. Time for self-study! 🎉
        </div>
      ) : (
        <div className="space-y-3">
          {todaysClasses.map((item, idx) => (
            <div
              key={item.id}
              className={`p-3.5 rounded-xl border transition-all ${item.color} hover:shadow-sm`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wide opacity-80">
                    {item.code}
                  </span>
                  <h4 className="text-sm font-bold leading-tight mt-0.5">{item.title}</h4>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-white/80 dark:bg-slate-900/60 shadow-xs">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  <span>{item.startTime} - {item.endTime}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-2.5 text-xs opacity-90 pt-2 border-t border-black/5 dark:border-white/10">
                <div className="flex items-center gap-1 font-semibold">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{item.room}</span>
                </div>
                <div className="flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>{item.instructor}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
