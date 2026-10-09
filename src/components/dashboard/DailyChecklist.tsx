'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { CheckSquare, Plus, Trash2, CheckCircle2, Circle } from 'lucide-react';

export const DailyChecklist: React.FC = () => {
  const { dailyTasks, toggleDailyTask, addDailyTask, deleteDailyTask } = useApp();
  const [newTitle, setNewTitle] = useState('');

  const completedCount = dailyTasks.filter(t => t.completed).length;
  const percentage = dailyTasks.length > 0 ? Math.round((completedCount / dailyTasks.length) * 100) : 0;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    addDailyTask(newTitle.trim(), 'General');
    setNewTitle('');
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-emerald-500" />
          <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
            Daily Task Checklist
          </h3>
        </div>
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
          {completedCount} / {dailyTasks.length} Completed ({percentage}%)
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mb-4 overflow-hidden">
        <div
          className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Task list */}
      <div className="space-y-2 mb-4 max-h-56 overflow-y-auto pr-1">
        {dailyTasks.map((task) => (
          <div
            key={task.id}
            className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors ${
              task.completed
                ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800/60 text-slate-400 line-through'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
            }`}
          >
            <div
              onClick={() => toggleDailyTask(task.id)}
              className="flex items-center gap-3 cursor-pointer flex-1"
            >
              {task.completed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-slate-400 shrink-0" />
              )}
              <span className="text-xs font-medium">{task.title}</span>
            </div>

            <button
              onClick={() => deleteDailyTask(task.id)}
              className="text-slate-400 hover:text-red-500 p-1 transition-colors"
              title="Delete task"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Inline add task input */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          placeholder="Add a new quick task..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <button
          type="submit"
          className="px-3 py-1.5 bg-slate-900 dark:bg-slate-800 hover:bg-primary text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add</span>
        </button>
      </form>
    </div>
  );
};
