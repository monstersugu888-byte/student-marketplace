'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  CalendarDays,
  Clock,
  MapPin,
  UserCheck,
  Plus,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Sparkles,
  Trash2
} from 'lucide-react';
import { Modal } from '@/components/common/Modal';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export default function TimetablePage() {
  const { classes, studySessions, addStudySession, deleteStudySession } = useApp();

  const [activeTab, setActiveTab] = useState<'weekly' | 'daily' | 'sessions'>('weekly');
  const [selectedDayIndex, setSelectedDayIndex] = useState(1); // 1 = Mon, 2 = Tue, etc.

  // Modal for adding study session
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('14:00');
  const [endTime, setEndTime] = useState('16:00');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  const handleSessionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !subject || !date) return;

    addStudySession({
      title,
      subject,
      date,
      startTime,
      endTime,
      location,
      notes,
    });

    setTitle('');
    setSubject('');
    setDate('');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-slate-900 dark:text-white">
            Timetable & Calendar
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            View your weekly class schedule and manage personal study group sessions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold shadow-md shadow-primary/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Study Session</span>
          </button>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('weekly')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'weekly'
                ? 'bg-primary text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Weekly Timetable
          </button>
          <button
            onClick={() => setActiveTab('daily')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'daily'
                ? 'bg-primary text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Daily View
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'sessions'
                ? 'bg-primary text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Personal Study Sessions ({studySessions.length})
          </button>
        </div>
      </div>

      {/* 1. WEEKLY VIEW */}
      {activeTab === 'weekly' && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {DAYS.map((dayName, idx) => {
            const dayNum = idx + 1; // 1 = Monday
            const dayClasses = classes.filter(c => c.dayOfWeek === dayNum);

            return (
              <div
                key={dayName}
                className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-card flex flex-col h-full"
              >
                <div className="pb-3 mb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <h3 className="font-heading font-extrabold text-sm text-slate-900 dark:text-white">
                    {dayName}
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                    {dayClasses.length} {dayClasses.length === 1 ? 'class' : 'classes'}
                  </span>
                </div>

                <div className="space-y-3 flex-1">
                  {dayClasses.length === 0 ? (
                    <div className="py-6 text-center text-slate-400 text-xs font-medium">
                      No classes scheduled
                    </div>
                  ) : (
                    dayClasses.map((item) => (
                      <div
                        key={item.id}
                        className={`p-3 rounded-xl border ${item.color} transition-all hover:scale-[1.02]`}
                      >
                        <span className="text-[9px] font-extrabold uppercase tracking-wide opacity-80">
                          {item.code}
                        </span>
                        <h4 className="text-xs font-bold leading-snug mt-0.5">{item.title}</h4>

                        <div className="mt-2 space-y-1 text-[11px] opacity-90 pt-2 border-t border-black/5 dark:border-white/10">
                          <div className="flex items-center gap-1 font-semibold">
                            <Clock className="w-3 h-3 text-primary shrink-0" />
                            <span>{item.startTime} - {item.endTime}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span className="truncate">{item.room}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <UserCheck className="w-3 h-3 shrink-0" />
                            <span className="truncate">{item.instructor}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 2. DAILY VIEW */}
      {activeTab === 'daily' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-card space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedDayIndex(prev => prev > 1 ? prev - 1 : 5)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h3 className="text-lg font-heading font-extrabold text-slate-900 dark:text-white">
                {DAYS[selectedDayIndex - 1]} Schedule
              </h3>
              <button
                onClick={() => setSelectedDayIndex(prev => prev < 5 ? prev + 1 : 1)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-1">
              {DAYS.map((d, i) => (
                <button
                  key={d}
                  onClick={() => setSelectedDayIndex(i + 1)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedDayIndex === i + 1
                      ? 'bg-primary text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {d.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {classes.filter(c => c.dayOfWeek === selectedDayIndex).length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                No classes scheduled for {DAYS[selectedDayIndex - 1]}. Enjoy your free time! ☕
              </div>
            ) : (
              classes.filter(c => c.dayOfWeek === selectedDayIndex).map((item) => (
                <div
                  key={item.id}
                  className={`p-5 rounded-2xl border ${item.color} flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold uppercase px-2 py-0.5 rounded bg-black/10 dark:bg-white/10">
                        {item.code}
                      </span>
                      <h4 className="text-base font-bold">{item.title}</h4>
                    </div>
                    <p className="text-xs opacity-90">{item.subject} • Instructor: {item.instructor}</p>
                  </div>

                  <div className="flex items-center gap-6 text-xs font-bold shrink-0">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-slate-900/60 shadow-xs">
                      <Clock className="w-4 h-4 text-primary" />
                      <span>{item.startTime} - {item.endTime}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-slate-900/60 shadow-xs">
                      <MapPin className="w-4 h-4 text-rose-500" />
                      <span>{item.room}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 3. PERSONAL STUDY SESSIONS */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {studySessions.map((session) => (
              <div
                key={session.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-card flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {session.subject}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      {session.date} • {session.startTime} - {session.endTime}
                    </span>
                  </div>

                  <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white leading-tight mb-2">
                    {session.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">
                    {session.notes || 'No extra notes specified.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-slate-500 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    {session.location || 'Online / Library'}
                  </span>

                  <button
                    onClick={() => deleteStudySession(session.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    title="Remove session"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Study Session Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Schedule Personal Study Session"
      >
        <form onSubmit={handleSessionSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Session Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Operating Systems Group Study"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Subject *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Operating Systems"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Location / Room
            </label>
            <input
              type="text"
              placeholder="e.g. Library Study Room 4"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Notes & Goals
            </label>
            <textarea
              rows={3}
              placeholder="Topics to review or questions to solve..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark"
            >
              Add Session
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
