'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { BookOpenCheck, Clock, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

export const AssignmentDeadlineCards: React.FC = () => {
  const { assignments, toggleAssignmentStatus } = useApp();

  const pending = assignments
    .filter(a => a.status !== 'Completed')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 4);

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800';
      case 'Medium':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookOpenCheck className="w-5 h-5 text-primary" />
          <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
            Upcoming Assignments
          </h3>
        </div>
        <Link
          href="/assignments"
          className="text-xs font-bold text-primary hover:text-primary-dark flex items-center gap-1 transition-colors"
        >
          <span>View All ({assignments.length})</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {pending.length === 0 ? (
        <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs">
          No pending assignments! All caught up. ✨
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {pending.map((item) => {
            const isOverdue = new Date(item.dueDate) < new Date();

            return (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-purple-200 dark:hover:border-purple-800 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate">
                      {item.subject}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getPriorityBadge(item.priority)}`}>
                      {item.priority}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight mb-1">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                    {item.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-200/60 dark:border-slate-800 text-xs">
                  <div className={`flex items-center gap-1 font-semibold ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-300'}`}>
                    {isOverdue ? <AlertTriangle className="w-3.5 h-3.5 text-red-500" /> : <Clock className="w-3.5 h-3.5 text-amber-500" />}
                    <span>Due: {item.dueDate}</span>
                  </div>

                  <button
                    onClick={() => toggleAssignmentStatus(item.id)}
                    className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Done</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
