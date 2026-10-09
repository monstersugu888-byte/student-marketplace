'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { CheckCircle2, X } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toastMessage } = useApp();

  if (!toastMessage) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-100 px-4 py-3 rounded-xl shadow-xl border border-slate-700 animate-slide-up transition-all duration-300">
      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
      <span className="text-sm font-medium">{toastMessage}</span>
    </div>
  );
};
