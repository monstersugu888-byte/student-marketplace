'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Bell,
  CheckCircle2,
  Clock,
  Calendar,
  Megaphone,
  ShoppingBag,
  Check,
  Trash2,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

export default function NotificationsPage() {
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    unreadCount
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'deadline' | 'schedule' | 'announcement'>('all');

  const filtered = notifications.filter(n => {
    if (activeFilter === 'unread') return !n.read;
    if (activeFilter === 'deadline') return n.type === 'deadline';
    if (activeFilter === 'schedule') return n.type === 'schedule';
    if (activeFilter === 'announcement') return n.type === 'announcement';
    return true;
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'deadline':
        return <Clock className="w-5 h-5 text-amber-500" />;
      case 'schedule':
        return <Calendar className="w-5 h-5 text-blue-500" />;
      case 'announcement':
        return <Megaphone className="w-5 h-5 text-purple-500" />;
      case 'marketplace':
        return <ShoppingBag className="w-5 h-5 text-emerald-500" />;
      default:
        return <Bell className="w-5 h-5 text-indigo-500" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-slate-900 dark:text-white">
            Notification Center
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Stay updated with assignment deadlines, schedule changes, and campus announcements.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllNotificationsRead}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all"
          >
            <Check className="w-4 h-4 text-emerald-500" />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeFilter === 'all'
              ? 'bg-primary text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setActiveFilter('unread')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeFilter === 'unread'
              ? 'bg-primary text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Unread ({unreadCount})
        </button>
        <button
          onClick={() => setActiveFilter('deadline')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeFilter === 'deadline'
              ? 'bg-primary text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Deadlines
        </button>
        <button
          onClick={() => setActiveFilter('schedule')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeFilter === 'schedule'
              ? 'bg-primary text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Schedule Alerts
        </button>
        <button
          onClick={() => setActiveFilter('announcement')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeFilter === 'announcement'
              ? 'bg-primary text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Announcements
        </button>
      </div>

      {/* Notifications List */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800">
          <Bell className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No notifications here</h3>
          <p className="text-xs text-slate-500 mt-1">You are all caught up!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => markNotificationRead(item.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-4 ${
                !item.read
                  ? 'bg-purple-50/40 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900/60 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-90'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs shrink-0">
                  {getNotificationIcon(item.type)}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                      {item.title}
                    </h4>
                    {!item.read && (
                      <span className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {item.message}
                  </p>

                  <p className="text-[11px] text-slate-400 font-medium pt-1">
                    {item.timestamp}
                  </p>
                </div>
              </div>

              {item.link && (
                <Link
                  href={item.link}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary text-primary text-xs font-bold rounded-xl flex items-center gap-1 shrink-0 transition-colors"
                >
                  <span>View</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
