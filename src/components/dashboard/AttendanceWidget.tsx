'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { UserCheck, ArrowRight, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

export const AttendanceWidget: React.FC = () => {
  const { attendances, markAttendance } = useApp();

  const totalAttended = attendances.reduce((acc, curr) => acc + curr.attendedClasses, 0);
  const totalClasses = attendances.reduce((acc, curr) => acc + curr.totalClasses, 0);
  const overallPercentage = totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100) : 0;

  const lowAttendanceSubjects = attendances.filter(a => {
    const pct = (a.attendedClasses / (a.totalClasses || 1)) * 100;
    return pct < a.targetPercentage;
  });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-emerald-500" />
          <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
            Attendance Overview
          </h3>
        </div>
        <Link
          href="/attendance"
          className="text-xs font-bold text-primary hover:text-primary-dark flex items-center gap-1 transition-colors"
        >
          <span>Manage Tracker</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Main Overall Percentage Card */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border border-emerald-200 dark:border-emerald-800/40 mb-4">
        <div>
          <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">
            Overall Attendance Rate
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {overallPercentage}%
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              ({totalAttended} / {totalClasses} classes)
            </span>
          </div>
        </div>

        <div className="w-12 h-12 rounded-full border-4 border-emerald-500 flex items-center justify-center font-bold text-xs text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900 shadow-xs">
          {overallPercentage}%
        </div>
      </div>

      {/* Low Attendance Alert Warning if any */}
      {lowAttendanceSubjects.length > 0 && (
        <div className="p-3 mb-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
          <span>
            <strong>Warning:</strong> {lowAttendanceSubjects.length} subject(s) below target attendance threshold (75%).
          </span>
        </div>
      )}

      {/* Quick Mark Attendance for Subjects */}
      <div className="space-y-2.5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Quick Today's Attendance
        </p>

        {attendances.slice(0, 3).map((item) => {
          const pct = item.totalClasses > 0 ? Math.round((item.attendedClasses / item.totalClasses) * 100) : 0;
          const isBelowTarget = pct < item.targetPercentage;

          return (
            <div
              key={item.id}
              className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-bold text-slate-900 dark:text-white">
                  {item.code} - {item.subject}
                </span>
                <p className="text-[11px] text-slate-500">
                  Attendance: <strong className={isBelowTarget ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}>{pct}%</strong> ({item.attendedClasses}/{item.totalClasses})
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => markAttendance(item.id, 'Present')}
                  className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-bold rounded-lg text-[11px] flex items-center gap-1 transition-colors"
                  title="Mark Present today"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Present</span>
                </button>

                <button
                  onClick={() => markAttendance(item.id, 'Absent')}
                  className="px-2.5 py-1 bg-red-100 hover:bg-red-200 dark:bg-red-950/60 dark:hover:bg-red-900 text-red-700 dark:text-red-300 font-bold rounded-lg text-[11px] flex items-center gap-1 transition-colors"
                  title="Mark Absent today"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Absent</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
